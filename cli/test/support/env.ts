import dotenv from 'dotenv'
import path from 'path'
import { setupAuthentication } from '../../lib/auth'
import { Hydra } from 'alcaeus/node'
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
