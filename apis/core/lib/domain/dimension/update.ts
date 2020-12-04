import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'

interface UpdateDimensionCommand {
  metadataCollection: NamedNode
  dimensionMetadata: GraphPointer
  store?: ResourceStore
}

export async function update({
  metadataCollection,
  store = resourceStore(),
  dimensionMetadata,
}: UpdateDimensionCommand): Promise<GraphPointer> {
  const metadata = await store.getResource<DimensionMetadataCollection>(metadataCollection)

  metadata.updateDimension(dimensionMetadata)
  await store.save()

  const dataset = metadata.pointer.dataset.match(dimensionMetadata.term)
  return clownface({ dataset }).node(dimensionMetadata.term)
}
