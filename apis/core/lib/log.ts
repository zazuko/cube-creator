import debug from 'debug'

export const log = debug('creator')
export const warning = log.extend('warning')
export const error = log.extend('error')
