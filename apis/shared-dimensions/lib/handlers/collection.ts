import { NamedNode, Quad } from 'rdf-js'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'

interface CollectionHandler {
  memberType: NamedNode
  collectionType: NamedNode
  memberQuads: Quad[]
  collection: NamedNode
}

export function getCollection({ collection, memberQuads, memberType, collectionType }: CollectionHandler) {
  const dataset = $rdf.dataset(memberQuads)

  const graph = clownface({ dataset })
  const members = graph.has(rdf.type, memberType)

  return graph.node(collection)
    .addOut(rdf.type, [hydra.Collection, collectionType])
    .addOut(hydra.member, members)
    .addOut(hydra.totalItems, members.terms.length)
}
