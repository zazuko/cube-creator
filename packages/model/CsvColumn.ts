import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { initializer } from './lib/initializer'
import { csvw, dtype, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export interface CsvColumn extends RdfResource {
  name: string
  order: number
  samples: string[]
}

export function CsvColumnMixin<Base extends Constructor>(Resource: Base) {
  class Impl extends Resource implements Partial<CsvColumn> {
    @property.literal({ path: schema.name })
    name!: string

    @property.literal({ path: dtype.order, type: Number })
    order!: number;

    @property.literal({ path: cc.csvColumnSample, values: 'array' })
    samples!: string[];
  }

  return Impl
}

CsvColumnMixin.appliesTo = csvw.Column

type RequiredProperties = 'name' | 'order'

export const create = initializer<CsvColumn, RequiredProperties>(CsvColumnMixin, {
  types: [csvw.Column],
})
