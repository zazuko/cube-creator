import path from 'path'
import dotenv from 'dotenv'
import { setupAuthentication } from '../../lib/auth.js'
import { logger } from './logger.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export function setupEnv() {
  dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
  })
  dotenv.config({
    path: path.resolve(__dirname, '../../.test.env'),
  })
  dotenv.config({
    path: path.resolve(__dirname, '../../../.local.env'),
  })

  setupAuthentication({}, logger)
}
