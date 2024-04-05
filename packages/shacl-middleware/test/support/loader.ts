import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'

export function loader(pointers: GraphPointer<NamedNode>[]) {
  const resources = pointers.reduce((map, next) => map.set(next.term, next), $rdf.termMap<NamedNode, GraphPointer<NamedNode>>())

  return async function (id: NamedNode) {
    return resources.get(id) || null
  }
}
