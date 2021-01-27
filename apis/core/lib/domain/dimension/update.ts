import clownface, { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { DimensionMetadataCollection, Project } from '@cube-creator/model'
import { prov, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { findProject } from '../queries/cube-project'
import { canBeMappedToManagedDimension } from './DimensionMetadata'

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

  const dimension = metadata.updateDimension(dimensionMetadata)

  if (canBeMappedToManagedDimension(dimension) && !dimension.mappings) {
    const project = await store.getResource<Project>(await findProject(metadata))

    const slug = dimension.id.value.substring(dimension.id.value.lastIndexOf('/') + 1)
    const dimensionMapping = store.create(id.dimensionMapping(project, slug))
    dimensionMapping
      .addOut(rdf.type, prov.Dictionary)
      .addOut(schema.about, dimension.about)

    dimension.mappings = dimensionMapping.term
  } else if (!canBeMappedToManagedDimension(dimension) && dimension.mappings) {
    store.delete(dimension.mappings)
    dimension.mappings = undefined
  }

  const dataset = metadata.pointer.dataset.match(dimensionMetadata.term)
  return clownface({ dataset }).node(dimensionMetadata.term)
}
