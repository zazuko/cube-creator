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

  import type { Logger } from 'winston'
  import type stream from 'readable-stream'
  import type { GraphPointer } from 'clownface'

  namespace Pipeline {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface VariableNames {}

    // eslint-disable-next-line @typescript-eslint/ban-types
    interface Variables extends Map<keyof VariableNames, any> {
      get<K extends keyof VariableNames>(key: K): VariableNames[typeof key]
      set<K extends keyof VariableNames>(key: K, value: VariableNames[typeof key] | undefined): this
    }

    interface Context {
      logger: Logger
      variables: Variables
    }
  }

  interface PipelineStep {
    stream: stream.Readable | stream.Writable
  }

  class Pipeline extends stream.Stream {
    context: Pipeline.Context
    ptr: GraphPointer
    stream: stream.Readable | stream.Writable
    children: PipelineStep[]
  }

  export = Pipeline
}
