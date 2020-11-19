import { Constructor, property, RdfResource } from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'

export interface DimensionMetadata extends RdfResource {
  about: NamedNode
}

export interface DimensionMetadataCollection extends RdfResource {
  hasPart: Array<DimensionMetadata>
}

export function DimensionMetadataMixin<Base extends Constructor>(Resource: Base) {
  class Impl extends Resource implements Partial<DimensionMetadata> {
    @property.resource({ path: schema.about })
    about!: NamedNode
  }

  return Impl
}

DimensionMetadataMixin.shouldApply = false

export function DimensionMetadataCollectionMixin<Base extends Constructor>(Resource: Base) {
  class Impl extends Resource implements Partial<DimensionMetadataCollection> {
    @property.resource({ path: schema.hasPart, values: 'array' })
    hasPart!: Array<DimensionMetadata>
  }

  return Impl
}

export const createCollection = initializer<DimensionMetadataCollection>(DimensionMetadataCollectionMixin, {
  types: [cc.DimensionMetadataCollection],
})

DimensionMetadataCollectionMixin.appliesTo = cc.DimensionMetadataCollection

type RequiredProperties = 'about'

export const create = initializer<DimensionMetadata, RequiredProperties>(DimensionMetadataMixin)
