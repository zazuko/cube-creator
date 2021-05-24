import { parse as _parse, Template } from 'uri-template'
import isUri from 'is-uri'

export interface ParsedTemplate {
  prefix: string
  columnNames: string[]
  toString(): string
  renameColumnVariable(from: string, to: string): boolean
  toAbsoluteUrl (baseUri: string): string
}

class ParsedTemplateWrapper implements ParsedTemplate {
  private __template: Template

  constructor(template: Template) {
    this.__template = template
  }

  get prefix() {
    return this.__template.prefix
  }

  get columnNames() {
    return this.__template.expressions.map(expr => expr.params[0].name)
  }

  toString() {
    return this.__template.toString()
  }

  renameColumnVariable(from: string, to: string) {
    const expression = this.__template.expressions.find(expr => expr.params[0].name === from)
    if (!expression) {
      return false
    }

    expression.params[0].name = to
    return true
  }

  toAbsoluteUrl(baseUri: string) {
    if (isUri(this.prefix)) {
      return this.toString()
    }

    if (!baseUri.match('[#/]$')) {
      return `${baseUri}/${this.toString()}`
    }

    return baseUri + this.toString()
  }
}

export function parse(template: string): ParsedTemplate {
  const escaped = template.replace(/{([^}]+)}/g, (_, name) => `{${escape(name)}}`)

  const parsed = _parse(escaped)
  parsed.expressions.forEach(expression => {
    expression.params.forEach(p => {
      // TODO: required until grncdr/uri-template#19 is fixed
      p.explode = ''
      p.name = unescape(p.name)
    })
  })

  return new ParsedTemplateWrapper(parsed)
}
