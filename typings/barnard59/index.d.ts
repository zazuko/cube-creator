declare module 'barnard59' {
  export const fileToDataset: any
}

declare module 'barnard59/lib/bufferDebug'

declare module 'barnard59/lib/runner' {
  import { DatasetCore } from 'rdf-js'
  import { Writable } from 'stream'
  import type { Debugger } from 'debug'

  type Runner = {
    pipeline: any
    promise: Promise<any>
  }

  interface RunnerInit {
    dataset: DatasetCore
    basePath: string
    outputStream: Writable
    term: string
    variable?: Map<string, string>
  }

  function create(options: RunnerInit): Runner

  const log: Debugger

  export {
    create,
    log,
  }
}
