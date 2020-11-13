import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { CsvColumn } from './CsvColumn'
import { NamedNode, Term } from 'rdf-js'
import { Link } from './lib/Link'
import { Constructor, namespace, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { initializer } from './lib/initializer'

export interface ColumnMapping extends RdfResource {
  sourceColumn: Link<CsvColumn>
  targetProperty: Term
  datatype: NamedNode
  language: string
  defaultValue: Term
}

export function ColumnMappingMixin<Base extends Constructor>(Resource: Base) {
  @namespace(cc as any)
  class Impl extends Resource implements Partial<ColumnMapping> {
    @property.resource()
    sourceColumn!: Link<CsvColumn>

    @property()
    targetProperty!: Term

    @property()
    datatype?: NamedNode

    @property()
    language?: string

    @property()
    defaultValue?: Term
  }

  return Impl
}

ColumnMappingMixin.appliesTo = cc.ColumnMapping

type RequiredProperties = 'sourceColumn' | 'targetProperty'

export const create = initializer<ColumnMapping, RequiredProperties>(ColumnMappingMixin, {
  types: [cc.ColumnMapping],
})
