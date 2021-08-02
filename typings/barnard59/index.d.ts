declare module 'barnard59' {
  export const fileToDataset: any
}

declare module 'barnard59/lib/bufferDebug.js'

declare module 'barnard59/runner.js' {
  import { Writable } from 'stream'
  import type * as Pipeline from 'barnard59-core/lib/Pipeline'
  import type { GraphPointer } from 'clownface'
  import type { Logger } from 'winston'

  type Runner = Promise<{
    pipeline: Pipeline
    finished: Promise<any>
  }>

  interface RunnerInit {
    basePath: string
    outputStream: Writable
    variables?: Pipeline.Variables
    logger?: Logger
    level?: 'error' | 'info' | 'debug'
  }

  export default function create(ptr: GraphPointer, options: RunnerInit): Runner
}
