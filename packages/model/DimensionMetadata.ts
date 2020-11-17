import { Constructor, property, RdfResource } from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'

interface DimensionMetadata {
  about: NamedNode
}

export interface DimensionMetadataCollection extends RdfResource {
  hasPart: Array<DimensionMetadata>
}

export function DimensionMetadataCollectionMixin<Base extends Constructor>(Resource: Base) {
  class Impl extends Resource implements Partial<DimensionMetadataCollection> {
    @property.resource({ path: schema.hasPart, values: 'array' })
    hasPart!: Array<DimensionMetadata>
  }

  return Impl
}
