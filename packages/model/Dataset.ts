import type { Literal } from '@rdfjs/types'
import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { _void, dcat, dcterms, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer.js'
import { Cube } from './Cube.js'
import { DimensionMetadataCollection, DimensionMetadataCollectionMixin } from './DimensionMetadata.js'
import { Link } from './lib/Link.js'
import { childResource } from './lib/resourceIdentifiers.js'

export interface Dataset extends RdfResource {
  hasPart: Cube[]
  dimensionMetadata: Link<DimensionMetadataCollection>
  title: Literal[]
  created: Date
  published: Date
}

export const Error = {
  MissingObservationValues: 'missing-values-error',
  MultipleDimensionValues: 'non-unique-observations',
} as const

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

    @property.literal({ path: schema.datePublished, type: Date, datatype: xsd.date })
    published!: Date
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
