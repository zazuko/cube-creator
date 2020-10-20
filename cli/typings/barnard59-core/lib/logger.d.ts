declare module 'barnard59-core/lib/logger' {

  import { Transform } from 'readable-stream'

  type LogDetails = Record<string, any> & { name: string }

  class Logger extends Transform {
    writeLog(level, message, { name, ...details })

    trace(message: string, details?: LogDetails);

    debug(message: string, details?: LogDetails);

    info(message: string, details?: LogDetails);

    warn(message: string, details?: LogDetails);

    error(message: string, details?: LogDetails);

    fatal(message: string, details?: LogDetails);
  }

  export = Logger
}
