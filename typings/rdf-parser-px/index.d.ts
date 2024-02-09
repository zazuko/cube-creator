declare module 'rdf-parser-px' {
  import { Readable, Transform } from 'stream'
  import type { Sink, Stream } from '@rdfjs/types'

  interface ColumnMetadata {
    titles: string | string []
    datatype?: string
  }

  interface ParserOptions {
    baseIRI: string
    encoding?: string
    metadata: Array<ColumnMetadata>
    observer?: string
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface RdfParserPx extends Transform, Sink<Readable, Readable & Stream> {}

  class RdfParserPx {
    constructor(params: ParserOptions)
  }

  export = RdfParserPx
}
