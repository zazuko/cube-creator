import RdfResource, { Constructor, namespace, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { NamedNode } from 'rdf-js'
import { CsvSource } from './CsvSource'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { schema } from '@tpluscode/rdf-ns-builders'

export interface Table extends RdfResourceCore {
  csvw: NamedNode
  csvSource: CsvSource
  name: string
}

export function TableMixin<Base extends Constructor>(base: Base) {
  @namespace(cc as any)
  class Impl extends base implements Table {
    @property()
    csvw!: NamedNode

    @property.resource()
    csvSource!: CsvSource

    @property.literal({ path: schema.name })
    name!: string
  }

  return Impl
}

TableMixin.appliesTo = cc.Table
TableMixin.Class = TableMixin(RdfResource)
