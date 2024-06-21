import type { Literal, NamedNode, Term } from '@rdfjs/types'
import * as Rdfs from '@rdfine/rdfs'
import { Constructor, namespace, property, RdfResource } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { qudt, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc, cube, meta } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer.js'
import './BaseResource.js'

export interface DimensionMetadata extends RdfResource {
  about: NamedNode
  name: Literal[]
  description: Literal[]
  scaleOfMeasure?: NamedNode
  dataKind?: Term
  mappings?: NamedNode
  isKeyDimension: boolean
  isMeasureDimension: boolean
  order?: number
}

export interface DimensionMetadataCollection extends RdfResource {
  hasPart: Array<DimensionMetadata>
}

function DimensionMetadataMixin<Base extends Constructor>(base: Base): Mixin {
  @namespace(schema)
  class Impl extends Rdfs.ResourceMixin(base) implements Partial<DimensionMetadata> {
    @property()
    about!: NamedNode

    @property({ values: 'array' })
    name!: Literal[]

    @property({ values: 'array' })
    description!: Literal[]

    @property({ path: qudt.scaleType })
    scaleOfMeasure?: NamedNode

    @property({ path: meta.dataKind })
    dataKind?: NamedNode

    @property({ path: cc.dimensionMapping })
    mappings?: NamedNode

    @property.literal({ path: sh.order, type: Number })
    order?: number

    get isMeasureDimension(): boolean {
      return this.types.has(cube.MeasureDimension)
    }

    get isKeyDimension(): boolean {
      return this.types.has(cube.KeyDimension)
    }
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

export const Error = {
  MissingMeasureDimension: 'MissingMeasureDimension',
  DimensionMappingChanged: 'DimensionMappingChanged',
} as const

export const noMeasureDimensionError = {
  type: schema.Thing,
  identifierLiteral: Error.MissingMeasureDimension,
  description: 'No Measure dimension defined',
}

export const dimensionChangedWarning = {
  type: schema.Thing,
  identifierLiteral: Error.DimensionMappingChanged,
  description: 'Dimension mappings changed. It may be necessary to run transformation',
}

export const createCollection = initializer<DimensionMetadataCollection>(DimensionMetadataCollectionMixin, {
  types: [cc.DimensionMetadataCollection],
  [schema.error.value]: [noMeasureDimensionError],
})

type RequiredProperties = 'about'

export const create = initializer<DimensionMetadata, RequiredProperties>(DimensionMetadataMixin)
