export interface ParsedTemplate {
  prefix: string
  columnNames: string[]
  toString(): string
  renameColumnVariable(from: string, to: string): boolean
  toAbsoluteUrl (baseUri: string): string
  toRegex (baseUri: string): string
}

export function parse(template: string): ParsedTemplate
