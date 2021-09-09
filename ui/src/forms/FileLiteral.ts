import { Literal } from 'rdf-js'
import LiteralExt from 'rdf-ext/lib/Literal'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FileLiteral extends Literal {}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class FileLiteral extends LiteralExt {
  constructor (public file: File) {
    super(file.name)
  }
}
