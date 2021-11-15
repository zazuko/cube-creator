import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Quad } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { DimensionMetadataCollection, Project } from '@cube-creator/model'
import { createNoMeasureDimensionError, Error } from '@cube-creator/model/DimensionMetadata'
import { prov, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { findProject } from '../cube-projects/queries'
import { canBeMappedToSharedDimension } from './DimensionMetadata'

interface UpdateDimensionCommand {
  metadataCollection: NamedNode
  dimensionMetadata: GraphPointer
  store: ResourceStore
}

function * extractSubgraph(pointer: GraphPointer, visited = new TermSet()): Iterable<Quad> {
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
    const project = await store.getResource<Project>(await findProject(metadata))

    const slug = dimension.id.value.substring(dimension.id.value.lastIndexOf('/') + 1)
    const dimensionMapping = store.create(id.dimensionMapping(project, slug))
    dimensionMapping
      .addOut(rdf.type, prov.Dictionary)
      .addOut(schema.about, dimension.about)

    dimension.mappings = dimensionMapping.term
  } else if (!canBeMappedToSharedDimension(dimension) && dimension.mappings) {
    store.delete(dimension.mappings)
    dimension.mappings = undefined
  }

  if (!metadata.hasPart.some(dim => dim.isMeasureDimension)) {
    if (!metadata.errors?.some(error => error.identifierLiteral === Error.MissingMeasureDimension)) {
      metadata.errors = <any>[
        ...metadata.errors!,
        createNoMeasureDimensionError,
      ]
    }
  } else {
    metadata.pointer
      .out(schema.error)
      .has(schema.identifier, Error.MissingMeasureDimension)
      .deleteOut()
      .deleteIn()
  }

  const dataset = $rdf.dataset([...extractSubgraph(metadata.pointer.node(dimensionMetadata.term))])
  return clownface({ dataset }).node(dimensionMetadata.term)
}
