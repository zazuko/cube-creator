declare module 'rdf-utils-fs/fromFile.js' {
  import { Stream } from 'rdf-js'

  function fromFile(filename: string): Stream

  export = fromFile
}
