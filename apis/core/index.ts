import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import express from 'express'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { hydraBox } from '@hydrofoil/labyrinth'
import { problemJson } from '@hydrofoil/labyrinth/errors.js'
import { sharedDimensions } from '@cube-creator/shared-dimensions-api'
import { resource } from 'express-rdf-request'
import cors from 'cors'
import env from '@cube-creator/core/env/node'
import { errorMappers } from '@cube-creator/api-errors'
import $rdf from '@cube-creator/env'
import Environment from '@zazuko/env/Environment.js'
import Fs from '@zazuko/rdf-utils-fs/Factory.js'
import asyncMiddleware from 'middleware-async'
import { error, log } from './lib/log.js'
import authentication from './lib/auth.js'
import { bootstrap } from './bootstrap/index.js'
import { resourceStore } from './lib/middleware/resource.js'
import { expectsDisambiguate, preferHydraCollection } from './lib/middleware/operations.js'
import upload from './lib/upload.js'
import Loader from './lib/Loader.js'
import * as s3 from './lib/storage/s3.js'
import pkg from './package.json' assert { type: 'json' }
import './lib/domain/index.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const apiPath = path.resolve(__dirname, 'hydra')
const codePath = path.resolve(__dirname, 'lib')
const baseUri = env.API_CORE_BASE
const endpointUrl = env.STORE_QUERY_ENDPOINT
const updateUrl = env.STORE_UPDATE_ENDPOINT
const storeUrl = env.STORE_GRAPH_ENDPOINT
const user = env.maybe.STORE_ENDPOINTS_USERNAME
const password = env.maybe.STORE_ENDPOINTS_PASSWORD

async function main() {
  log('Starting Core API. Environment %s', env.production ? 'production' : 'development')

  const app = express()

  Sentry.init({
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Tracing.Integrations.Express({ app }),
    ],
    tracesSampleRate: 1.0,
  })

  app.enable('trust proxy')

  app.use((req, res, next) => {
    res.setHeader('x-cube-creator', pkg.version)
    next()
  })

  app.use(cors({
    origin: '*',
    credentials: true,
    // Add OPTIONS
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Origin', 'Content-Type', 'Accept', 'X-User', 'X-Permission', 'Prefer'],
    // Needed by uppy/companion
    exposedHeaders: ['Access-Control-Allow-Headers'],
  }))

  app.get('/ping', (req, res) => res.status(204).end())

  app.get('/', (req, res, next) => {
    if (req.accepts('text/html')) {
      res.redirect('/app')
    } else {
      next()
    }
  })

  app.use(Sentry.Handlers.requestHandler())
  app.use(Sentry.Handlers.tracingHandler())

  app.use(await authentication())
  app.use(resource)

  app.use('/dimension', await sharedDimensions())

  app.use('/upload', upload)

  app.use(resourceStore)
  app.use(asyncMiddleware(await hydraBox({
    env: new Environment([Fs], { parent: $rdf }),
    apiPath,
    codePath,
    baseUri,
    sparql: {
      endpointUrl,
      updateUrl,
      storeUrl,
      user,
      password,
    },
    middleware: {
      operations: [
        preferHydraCollection,
        expectsDisambiguate,
      ],
    },
    loader: new Loader($rdf, {
      endpointUrl,
      user,
      password,
    }),
  })))

  app.use(Sentry.Handlers.errorHandler())
  app.use(problemJson({ errorMappers, captureNotFound: true }))

  await bootstrap(env.STORE_GRAPH_ENDPOINT, baseUri)

  s3.setup()

  if (!env.production) {
    const key = fs.readFileSync('/certs/cert.key')
    const cert = fs.readFileSync('/certs/cert.crt')
    https.createServer({ key, cert }, app)
      .listen(443, () => log('Dev server listening on 443'))
  }
  http.createServer(app)
    .listen(45670, () => log('Api ready'))
}

main().catch(error)
