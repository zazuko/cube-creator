import type { Literal, NamedNode, Quad } from '@rdfjs/types'
import { turtle } from '@tpluscode/rdf-string'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { validateQuad } from 'rdf-validate-datatype'

export function validate(this: Context, quad: Quad): Quad {
  if (!validateQuad(quad)) {
    throw new Error(`${errorMessage(quad)}\n\n${quadToString(quad)}`)
  }

  return quad
}

function quadToString(quad: Quad): string {
  return turtle`${quad}`.toString({
    directives: false, // do not print @prefix
    graph: quad.graph as NamedNode,
  })
}

function errorMessage(quad: Quad): string {
  const literal = quad.object as Literal
  if (!literal.datatype) {
    return `Invalid datatype for non-literal ${literal.value}`
  }

  return `literal "${literal.value}" is not a valid value for datatype <${literal.datatype.value}>.`
}
