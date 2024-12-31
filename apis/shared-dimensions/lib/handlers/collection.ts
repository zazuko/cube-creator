import type { NamedNode, Quad, Stream } from '@rdfjs/types'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

export interface CollectionData<M extends Stream | Iterable<Quad> = Stream | Iterable<Quad>> {
  members: M
  totalItems?: number
}

interface CollectionHandler {
  memberType: NamedNode
  collectionType: NamedNode
  view?: NamedNode
  data: CollectionData<Iterable<Quad>>
  collection: NamedNode
}

export function getCollection({ collection, view, data: { members: memberQuads, totalItems }, memberType, collectionType }: CollectionHandler): GraphPointer<NamedNode> {
  const dataset = $rdf.dataset([...memberQuads])

  const graph = clownface({ dataset })
  const members = graph.has(rdf.type, memberType)

  graph.node(collection)
    .addOut(rdf.type, [hydra.Collection, collectionType])
    .addOut(hydra.member, members)

  if (totalItems) {
    graph.node(collection).addOut(hydra.totalItems, totalItems)
  } else {
    graph.node(collection).addOut(hydra.totalItems, members.terms.length)
  }

  if (view) {
    graph.node(view)
      .addOut(rdf.type, hydra.PartialCollectionView)
      .addIn(hydra.view, collection)
  }

  return graph.node(collection)
}
