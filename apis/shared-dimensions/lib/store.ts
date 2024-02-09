import type { NamedNode, Term } from '@rdfjs/types'
import { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { parsingClient } from './sparql'
import env from './env'
import Store from './store/index'

export interface SharedDimensionsStore {
  graph: NamedNode
  load(id: Term | undefined): Promise<GraphPointer<NamedNode>>
  save(resource: GraphPointer<NamedNode>): Promise<void>
  delete(id: NamedNode): Promise<void>
  exists(id: NamedNode, type: NamedNode): Promise<boolean>
}

export function store(client = parsingClient): SharedDimensionsStore {
  return new Store(client, $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
}
