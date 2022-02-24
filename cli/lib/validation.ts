import { NamedNode, Quad } from 'rdf-js'
import { turtle } from '@tpluscode/rdf-string'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { validateQuad } from 'rdf-validate-datatype'

export function validate(this: Context, quad: Quad): Quad {
  if (!validateQuad(quad)) {
    throw new Error(`Quad object has invalid datatype:\n\t${quadToString(quad)}`)
  }

  return quad
}

function quadToString(quad: Quad): string {
  return turtle`${quad}`.toString({
    directives: false, // do not print @prefix
    graph: quad.graph as NamedNode,
  })
}
