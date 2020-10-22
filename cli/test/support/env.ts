import dotenv from 'dotenv'
import path from 'path'
import debug from 'debug'
import { setupAuthentication } from '../../lib/auth'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export const logger = debug('tests')

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
