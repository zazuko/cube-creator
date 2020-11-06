import type Logger from 'barnard59-core/lib/logger'
import { logger } from './env'

logger.enabled = true

export const log: Logger = {
  writeLog(lvl, msg, detail) {
    logger.extend(lvl)(msg, detail)
  },
  debug: logger.extend('debug'),
  info: logger.extend('info'),
  warn: logger.extend('warn'),
  error: logger.extend('error'),
  trace: logger.extend('trace'),
  fatal: logger.extend('fatal'),
}
