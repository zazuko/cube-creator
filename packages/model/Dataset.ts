import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { _void, dcat, dcterms, schema } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'
import { Cube } from './Cube'
import { DimensionMetadataCollection, DimensionMetadataCollectionMixin } from './DimensionMetadata'
import { Link } from './lib/Link'
import { childResource } from './lib/resourceIdentifiers'
import { Literal } from 'rdf-js'

export interface Dataset extends RdfResource {
  hasPart: Cube[]
  dimensionMetadata: Link<DimensionMetadataCollection>
  title: Literal[]
}

export function DatasetMixin<Base extends Constructor>(Resource: Base): Mixin {
  class Impl extends Resource implements Partial<Dataset> {
    @property.resource({ path: schema.hasPart, values: 'array', implicitTypes: [cube.Cube] })
    hasPart!: Cube[]

    @property.resource({
      path: cc.dimensionMetadata,
      as: [DimensionMetadataCollectionMixin],
      initial: childResource('dimension-metadata'),
    })
    dimensionMetadata!: Link<DimensionMetadataCollection>

    @property({ path: dcterms.title, values: 'array' })
    title?: Literal[]
  }

  return Impl
}

DatasetMixin.appliesTo = _void.Dataset

export const create = initializer<Dataset>(DatasetMixin, {
  types: [_void.Dataset, schema.Dataset, dcat.Dataset],
})
