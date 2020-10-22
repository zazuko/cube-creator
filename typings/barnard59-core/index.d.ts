declare module 'barnard59-core'

declare module 'barnard59-core/lib/logger' {

  type LogDetails = Record<string, any> & { name: string }

  class Logger {
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

declare module 'barnard59-core/lib/Pipeline' {

  import type Logger from 'barnard59-core/lib/logger'

  namespace Pipeline {
    interface Context {
      log: Logger
      variables: Map<any, any>
    }
  }

  class Pipeline {
    context: Pipeline.Context
  }

  export = Pipeline
}
