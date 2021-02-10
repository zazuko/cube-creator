declare module 'barnard59-base/lib/map' {
  import * as stream from 'stream'
  import type { Context } from 'barnard59-core/lib/Pipeline'

  function map<T>(cb: (this: Context, chunk: T, encoding: string) => Promise<T> | T): stream.Transform

  export = map
}
