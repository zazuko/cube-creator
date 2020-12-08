declare module 'barnard59-base/lib/map' {
  import * as stream from 'stream'

  function map<T>(cb: (chunk: T, encoding: string) => T): stream.Transform

  export = map
}
