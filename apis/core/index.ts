import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import express from 'express'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import { hydraBox } from '@hydrofoil/labyrinth'
import { problemJson } from '@hydrofoil/labyrinth/errors'
import { sharedDimensions } from '@cube-creator/shared-dimensions-api'
import { resource } from 'express-rdf-request'
import cors from 'cors'
import env from '@cube-creator/core/env'
import { errorMappers } from '@cube-creator/api-errors'
import { error, log } from './lib/log'
import authentication from './lib/auth'
import { bootstrap } from './bootstrap'
import { resourceStore } from './lib/middleware/resource'
import { expectsDisambiguate, preferHydraCollection } from './lib/middleware/operations'
import './lib/domain'
import upload from './lib/upload'
import Loader from './lib/Loader'
import * as s3 from './lib/storage/s3'
import { version } from './package.json'

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
    res.setHeader('x-cube-creator', version)
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
  app.use(await hydraBox({
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
    loader: new Loader({
      endpointUrl,
      user,
      password,
    }),
  }))

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
