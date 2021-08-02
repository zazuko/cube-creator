declare module 'barnard59-base/map.js' {
  import * as stream from 'stream'
  import type { Context } from 'barnard59-core/lib/Pipeline'

  export default function map<T>(cb: (this: Context, chunk: T, encoding: string) => Promise<T> | T): stream.Transform
}
