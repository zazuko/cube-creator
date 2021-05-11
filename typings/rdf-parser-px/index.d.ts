declare module 'rdf-parser-px' {
  import { Readable, Transform } from 'stream'
  import { Sink, Stream } from 'rdf-js'

  interface ColumnMetadata {
    titles: string | string []
    datatype?: string
  }

  interface ParserOptions {
    baseIRI: string
    encoding?: string
    metadata: Array<ColumnMetadata>
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface RdfParserPx extends Transform, Sink<Readable, Readable & Stream> {}

  class RdfParserPx {
    constructor(params: ParserOptions)
  }

  export = RdfParserPx
}
