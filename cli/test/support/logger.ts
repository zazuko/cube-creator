import { logger } from './env'

export const log = {
  debug: logger.extend('debug'),
  info: logger.extend('info'),
  warn: logger.extend('warn'),
  error: logger.extend('error'),
}
