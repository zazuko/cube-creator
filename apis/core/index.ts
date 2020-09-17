import express from 'express'
import * as path from 'path'
import { hydraBox } from '@hydrofoil/labyrinth'
import { error, log } from './lib/log'
import authentication from './lib/auth'
import env from './lib/env'
import { uiConfig } from './frontend'
import { bootstrap } from './bootstrap'

const apiPath = path.resolve(__dirname, 'hydra')
const codePath = path.resolve(__dirname, 'lib')
const baseUri = env.API_CORE_BASE

async function main() {
  log('Starting Core API. Environment %s', env.production ? 'production' : 'development')

  const app = express()

  app.enable('trust proxy')

  app.get('/env-config.js', uiConfig)
  app.get('/ping', (req, res) => res.status(204).end())

  app.use(await authentication())
  await hydraBox(app, {
    apiPath,
    codePath,
    baseUri,
    sparql: {
      endpointUrl: env.STORE_QUERY_ENDPOINT,
      updateUrl: env.STORE_UPDATE_ENDPOINT,
      storeUrl: env.STORE_GRAPH_ENDPOINT,
    },
  })

  await bootstrap(env.STORE_GRAPH_ENDPOINT, baseUri)

  app.listen(45670, () => log('Api ready'))
}

main().catch(error)
