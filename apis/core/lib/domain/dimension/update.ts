import type { NamedNode, Quad, Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { DimensionMetadataCollection, Project } from '@cube-creator/model'
import { createNoMeasureDimensionError, Error } from '@cube-creator/model/DimensionMetadata'
import { prov, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore.js'
import * as id from '../identifiers.js'
import { findProject } from '../cube-projects/queries.js'
import { canBeMappedToSharedDimension } from './DimensionMetadata.js'

interface UpdateDimensionCommand {
  metadataCollection: NamedNode
  dimensionMetadata: GraphPointer
  store: ResourceStore
}

function * extractSubgraph(pointer: GraphPointer, visited = $rdf.termSet()): Iterable<Quad> {
  if (visited.has(pointer.term)) {
    return
  }

  for (const quad of pointer.dataset.match(pointer.term)) {
    yield quad

    if (quad.object.termType === 'BlankNode') {
      visited.add(quad.object)
      for (const child of extractSubgraph(pointer.node(quad.object))) {
        yield child
      }
    }
  }
}

export async function update({
  metadataCollection,
  store,
  dimensionMetadata,
}: UpdateDimensionCommand): Promise<GraphPointer> {
  const metadata = await store.getResource<DimensionMetadataCollection>(metadataCollection)

  const dimension = metadata.updateDimension(dimensionMetadata)

  if (canBeMappedToSharedDimension(dimension) && !dimension.mappings) {
    const project = await store.getResource<Project>(await findProject({ metadataCollection: metadata }))

    const slug = dimension.id.value.substring(dimension.id.value.lastIndexOf('/') + 1)
    const dimensionMapping = store.create(id.dimensionMapping(project, slug))
    dimensionMapping
      .addOut(rdf.type, prov.Dictionary)
      .addOut(schema.about, dimension.about)
      .addOut(cc.batchMapping, $rdf.namedNode(dimensionMapping.value + '/_import-terms'))

    dimension.mappings = dimensionMapping.term
  } else if (!canBeMappedToSharedDimension(dimension) && dimension.mappings) {
    store.delete(dimension.mappings)
    dimension.mappings = undefined
  }

  if (!metadata.hasPart.some(dim => dim.isMeasureDimension)) {
    metadata.addError?.(createNoMeasureDimensionError($rdf))
  } else {
    metadata.removeError?.(Error.MissingMeasureDimension)
  }

  const dataset = $rdf.dataset([...extractSubgraph(metadata.pointer.node(dimensionMetadata.term))])
  return $rdf.clownface({ dataset }).node(dimensionMetadata.term)
}

interface ClearDimensionChangedWarning {
  id: Term
  store: ResourceStore
}

export async function clearDimensionChangedWarning({ id, store }: ClearDimensionChangedWarning) {
  const collection = await store.getResource<DimensionMetadataCollection>(id)

  collection.removeError?.(Error.DimensionMappingChanged)
}
