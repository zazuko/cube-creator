import express from 'express'
import { error, log } from './lib/log'
import authentication from './lib/auth'
import env from './lib/env'
import { uiConfig } from './frontend'

import guard = require('express-jwt-permissions')

async function main() {
  log('Starting Core API. Environment %s', env.production ? 'production' : 'development')

  const app = express()

  app.enable('trust proxy')

  app.get('/', (req, res) => {
    return res.status(200).end()
  })

  app.get('/env-config.js', uiConfig)

  app.use(authentication())

  app.get('/protected', guard().check('scope'), (req, res) => {
    return res.status(200).end()
  })

  app.listen(45670, () => log('Api ready'))
}

main().catch(error)
