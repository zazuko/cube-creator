import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { _void, dcat, schema } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'
import { Cube } from './Cube'
import { DimensionMetadataCollection, DimensionMetadataCollectionMixin } from './DimensionMetadata'
import { Link } from './lib/Link'
import { childResource } from './lib/resourceIdentifiers'

export interface Dataset extends RdfResource {
  hasPart: Cube[]
  dimensionMetadata: Link<DimensionMetadataCollection>
}

export function DatasetMixin<Base extends Constructor>(Resource: Base) {
  class Impl extends Resource implements Partial<Dataset> {
    @property.resource({ path: schema.hasPart, values: 'array', implicitTypes: [cube.Cube] })
    hasPart!: Cube[]

    @property.resource({
      path: cc.dimensionMetadata,
      as: [DimensionMetadataCollectionMixin],
      initial: childResource('dimension-metadata'),
    })
    dimensionMetadata!: Link<DimensionMetadataCollection>
  }

  return Impl
}

DatasetMixin.appliesTo = _void.Dataset

export const create = initializer<Dataset>(DatasetMixin, {
  types: [_void.Dataset, schema.Dataset, dcat.Dataset],
})
