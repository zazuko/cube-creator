import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'

export interface ManagedDimensionsStore {
  save(resource: GraphPointer<NamedNode>): Promise<void>
}
