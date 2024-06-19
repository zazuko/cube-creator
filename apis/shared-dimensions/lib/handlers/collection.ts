import type { NamedNode, Quad } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'

interface CollectionHandler {
  memberType: NamedNode
  collectionType: NamedNode
  view?: NamedNode
  memberQuads: Iterable<Quad>
  collection: NamedNode
}

export function getCollection({ collection, view, memberQuads, memberType, collectionType }: CollectionHandler): GraphPointer<NamedNode> {
  const dataset = $rdf.dataset(memberQuads)

  const graph = $rdf.clownface({ dataset })
  const members = graph.has(rdf.type, memberType)

  graph.node(collection)
    .addOut(rdf.type, [hydra.Collection, collectionType])
    .addOut(hydra.member, members)
    .addOut(hydra.totalItems, members.terms.length)

  if (view) {
    graph.node(view)
      .addOut(rdf.type, hydra.PartialCollectionView)
      .addIn(hydra.view, collection)
  }

  return graph.node(collection)
}
