import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { _void, dcat, dcterms, schema, xsd } from '@tpluscode/rdf-ns-builders'
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
  created: Date
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
    title!: Literal[]

    @property.literal({ path: dcterms.issued, type: Date, datatype: xsd.date })
    created!: Date
  }

  return Impl
}

DatasetMixin.appliesTo = _void.Dataset

export const create = initializer<Dataset>(DatasetMixin, () => {
  const created = new Date()

  return {
    types: [_void.Dataset, schema.Dataset, dcat.Dataset],
    created,
    [schema.dateCreated.value]: {
      value: created,
      datatype: xsd.date,
    },
  }
})
