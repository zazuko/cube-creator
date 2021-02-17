import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { ManagedDimensionsStore } from '../store'

interface CreateSharedDimension {
  termSet: GraphPointer<NamedNode>
  store: ManagedDimensionsStore
}

export async function create({ termSet, store }: CreateSharedDimension): Promise<GraphPointer> {
  const
}
