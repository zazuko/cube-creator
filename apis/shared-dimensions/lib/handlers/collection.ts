import type { NamedNode, Quad } from '@rdfjs/types'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

interface CollectionHandler {
  memberType: NamedNode
  collectionType: NamedNode
  view?: NamedNode
  memberQuads: Quad[]
  collection: NamedNode
}

export function getCollection({ collection, view, memberQuads, memberType, collectionType }: CollectionHandler) {
  const dataset = $rdf.dataset(memberQuads)

  const graph = clownface({ dataset })
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

  return graph
}
