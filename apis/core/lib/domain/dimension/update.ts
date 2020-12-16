import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'

interface UpdateDimensionCommand {
  metadataCollection: NamedNode
  dimensionMetadata: GraphPointer
  store: ResourceStore
}

export async function update({
  metadataCollection,
  store,
  dimensionMetadata,
}: UpdateDimensionCommand): Promise<GraphPointer> {
  const metadata = await store.getResource<DimensionMetadataCollection>(metadataCollection)

  metadata.updateDimension(dimensionMetadata)

  const dataset = metadata.pointer.dataset.match(dimensionMetadata.term)
  return clownface({ dataset }).node(dimensionMetadata.term)
}
