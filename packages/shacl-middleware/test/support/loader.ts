import TermMap from '@rdfjs/term-map'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'

export function loader(pointers: GraphPointer<NamedNode>[]) {
  const resources = pointers.reduce((map, next) => map.set(next.term, next), new TermMap<NamedNode, GraphPointer<NamedNode>>())

  return async function (id: NamedNode) {
    return resources.get(id) || null
  }
}
