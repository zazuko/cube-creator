declare module 'barnard59-core'

declare module 'barnard59-core/lib/logger' {

  type LogDetails = Record<string, any> & { name: string }

  class Logger {
    writeLog(level: string, message: string, { name, ...details }: Record<string, any>): void;

    trace(message: string, details?: LogDetails): void;

    debug(message: string, details?: LogDetails): void;

    info(message: string, details?: LogDetails): void;

    warn(message: string, details?: LogDetails): void;

    error(message: string, details?: LogDetails): void;

    fatal(message: string, details?: LogDetails): void;
  }

  export = Logger
}

declare module 'barnard59-core/lib/Pipeline' {

  import type Logger from 'barnard59-core/lib/logger'
  import stream from 'stream'

  namespace Pipeline {
    interface Context {
      log: Logger
      variables: Map<any, any>
    }
  }

  class Pipeline extends stream.Stream {
    context: Pipeline.Context
  }

  export = Pipeline
}
