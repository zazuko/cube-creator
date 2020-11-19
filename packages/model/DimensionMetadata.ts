import { Constructor, namespace, property, RdfResource } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Literal, NamedNode } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'

export interface DimensionMetadata extends RdfResourceCore {
  about?: NamedNode
  name: Literal[]
}

export interface DimensionMetadataCollection extends RdfResource {
  hasPart: Array<DimensionMetadata>
}

function DimensionMetadataMixin<Base extends Constructor>(Resource: Base) {
  @namespace(schema)
  class Impl extends Resource implements DimensionMetadata {
    @property()
    about!: NamedNode

    @property({ values: 'array' })
    name!: Literal[]
  }

  return Impl
}

export function DimensionMetadataCollectionMixin<Base extends Constructor>(Resource: Base): Mixin {
  class Impl extends Resource implements Partial<DimensionMetadataCollection> {
    @property.resource({ path: schema.hasPart, values: 'array', as: [DimensionMetadataMixin] })
    hasPart!: Array<DimensionMetadata>
  }

  return Impl
}

DimensionMetadataCollectionMixin.appliesTo = cc.DimensionMetadataCollection

export const createCollection = initializer<DimensionMetadataCollection>(DimensionMetadataCollectionMixin, {
  types: [cc.DimensionMetadataCollection],
})
