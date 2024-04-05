import type { NamedNode, Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { parsingClient } from './sparql.js'
import env from './env.js'
import Store from './store/index.js'

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
