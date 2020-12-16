import debug from 'debug'

// eslint-disable-next-line no-console
debug.log = console.log.bind(console)

export const log = debug('creator')
export const warning = log.extend('warning')
export const error = log.extend('error')
