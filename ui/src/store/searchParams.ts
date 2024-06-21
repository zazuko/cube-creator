import type { AnyPointer, GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { query } from '@cube-creator/core/namespace'

export function clone (collection: AnyPointer): GraphPointer {
  const cloned = $rdf.clownface()
  const searchParams = collection.out(query.templateMappings)

  if (!searchParams.term) {
    return cloned.blankNode()
  }

  [...searchParams.dataset.match(searchParams.term)]
    .forEach(quad => {
      cloned.node(quad.subject).addOut(quad.predicate, quad.object)
    })

  return cloned.node(searchParams.term)
}
