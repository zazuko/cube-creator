import path from 'path'
import dotenv from 'dotenv'
import { Hydra } from 'alcaeus/node'
import { setupAuthentication } from '../../lib/auth'
import { logger } from './logger'

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

  setupAuthentication({}, logger, Hydra)
}
