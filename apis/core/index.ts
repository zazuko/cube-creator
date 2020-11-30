import express from 'express'
import * as http from 'http'
import * as https from 'https'
import * as fs from 'fs'
import * as path from 'path'
import { hydraBox } from '@hydrofoil/labyrinth'
import cors from 'cors'
import { error, log } from './lib/log'
import authentication from './lib/auth'
import env from '@cube-creator/core/env'
import { bootstrap } from './bootstrap'
import { resource } from './lib/middleware/resource'
import { expectsDisambiguate } from './lib/middleware/operations'
import { errorMappers } from './lib/errors'
import './lib/domain'

const apiPath = path.resolve(__dirname, 'hydra')
const codePath = path.resolve(__dirname, 'lib')
const baseUri = env.API_CORE_BASE

async function main() {
  log('Starting Core API. Environment %s', env.production ? 'production' : 'development')

  const app = express()

  app.enable('trust proxy')

  app.use(cors())

  app.get('/ping', (req, res) => res.status(204).end())

  app.get('/', (req, res, next) => {
    if (req.accepts('text/html')) {
      res.redirect('/app')
    } else {
      next()
    }
  })

  app.use(resource)
  app.use(await authentication())
  await hydraBox(app, {
    apiPath,
    codePath,
    baseUri,
    sparql: {
      endpointUrl: env.STORE_QUERY_ENDPOINT,
      updateUrl: env.STORE_UPDATE_ENDPOINT,
      storeUrl: env.STORE_GRAPH_ENDPOINT,
      user: env.maybe.STORE_ENDPOINTS_USERNAME,
      password: env.maybe.STORE_ENDPOINTS_PASSWORD,
    },
    errorMappers,
    middleware: {
      operations: [
        expectsDisambiguate,
      ],
    },
  })

  await bootstrap(env.STORE_GRAPH_ENDPOINT, baseUri)

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
