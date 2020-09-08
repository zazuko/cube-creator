import express from 'express'
import { error, log } from './lib/log'
import authentication from './lib/auth'

import guard = require('express-jwt-permissions')

async function main() {
  log('Starting Core API. Environment %s', process.env.NODE_ENV ?? 'production')

  const app = express()

  app.enable('trust proxy')

  app.get('/', (req, res) => {
    return res.status(200).end()
  })

  app.use(authentication())

  app.get('/authenticated', (req, res) => {
    return res.status(200).end()
  })

  app.get('/protected', guard().check('scope'), (req, res) => {
    return res.status(200).end()
  })

  app.listen(45670, () => log('Api ready'))
}

main().catch(error)
