import RdfResourceImpl, { Initializer, RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property, ResourceIdentifier } from '@tpluscode/rdfine'
import type { GraphPointer } from 'clownface'
import { csvw, dtype, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'

export interface CsvColumn extends RdfResource {
  name: string
  order: number
  samples: string[]
}

export function CsvColumnMixin<Base extends Constructor>(Resource: Base): Mixin {
  class Impl extends Resource implements Partial<CsvColumn> {
    @property.literal({ path: schema.name })
    name!: string

    @property.literal({ path: dtype.order, type: Number })
    order!: number

    @property.literal({ path: cc.csvColumnSample, values: 'array' })
    samples!: string[]
  }

  return Impl
}

CsvColumnMixin.appliesTo = csvw.Column

export const fromPointer = (pointer: GraphPointer<ResourceIdentifier>, initializer?: Initializer<CsvColumn>): CsvColumn => {
  return RdfResourceImpl.factory.createEntity<CsvColumn>(pointer, [CsvColumnMixin], {
    initializer,
  })
}

type RequiredProperties = 'name' | 'order'

export const create = initializer<CsvColumn, RequiredProperties>(CsvColumnMixin, {
  types: [csvw.Column],
})
