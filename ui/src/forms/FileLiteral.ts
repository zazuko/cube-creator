import type { Literal } from '@rdfjs/types'
import LiteralImpl from '@rdfjs/data-model/lib/Literal.js'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FileLiteral extends Literal {}

export class FileLiteral extends LiteralImpl {
  constructor (public file: File) {
    super(file.name)
  }
}
