import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { CsvColumn } from './CsvColumn'
import { Term } from 'rdf-js'
import { Link } from './lib/Link'
import { Constructor, namespace, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'

export interface ColumnMapping extends RdfResourceCore {
  sourceColumn: Link<CsvColumn>
  targetProperty: Term
}

export function ColumnMappingMixin<Base extends Constructor>(Resource: Base) {
  @namespace(cc as any)
  class Impl extends Resource implements Partial<ColumnMapping> {
    @property.resource()
    sourceColumn!: Link<CsvColumn>

    @property()
    targetProperty!: Term
  }

  return Impl
}

ColumnMappingMixin.appliesTo = cc.ColumnMapping

type RequiredProperties = 'sourceColumn' | 'targetProperty'

export const create = initializer<ColumnMapping, RequiredProperties>(ColumnMappingMixin, {
  types: [cc.ColumnMapping],
})
