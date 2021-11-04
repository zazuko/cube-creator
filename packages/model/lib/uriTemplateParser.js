/* eslint-disable @typescript-eslint/no-var-requires */
const uriTemplate = require('uri-template')
const isUri = require('is-uri')

class ParsedTemplateWrapper {
  constructor(template) {
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

  renameColumnVariable(from, to) {
    const expression = this.__template.expressions.find(expr => expr.params[0].name === from)
    if (!expression) {
      return false
    }

    expression.params[0].name = to
    return true
  }

  toAbsoluteUrl(baseUri) {
    if (isUri(this.prefix)) {
      return this.toString()
    }

    if (!baseUri.match('[#/]$')) {
      return `${baseUri}/${this.toString()}`
    }

    return baseUri + this.toString()
  }

  toRegex(baseUri) {
    const absolute = this.toAbsoluteUrl(baseUri)

    return '^' + absolute.replace(/{[^/]+}/g, '.+') + '$'
  }
}

export function parse(template) {
  const escaped = template.replace(/{([^}]+)}/g, (_, name) => `{${escape(name)}}`)

  const parsed = uriTemplate.parse(escaped)
  parsed.expressions.forEach(expression => {
    expression.params.forEach(p => {
      // TODO: required until grncdr/uri-template#19 is fixed
      p.explode = ''
      p.name = unescape(p.name)
    })
  })

  return new ParsedTemplateWrapper(parsed)
}
