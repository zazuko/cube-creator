import RdfResource, { Constructor, namespace, property } from '@tpluscode/rdfine'
import { NamedNode } from 'rdf-js'
import type * as Csvw from '@rdfine/csvw'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { CsvSource } from './CsvSource'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Link } from './lib/Link'

export interface Table extends RdfResourceCore {
  csvw: Link<Csvw.Table>
  csvSource: Link<CsvSource>
  name: string
  csvMapping: NamedNode
}

export function TableMixin<Base extends Constructor>(base: Base) {
  @namespace(cc as any)
  class Impl extends base implements Table {
    @property.resource()
    csvw!: Link<Csvw.Table>

    @property.resource()
    csvSource!: Link<CsvSource>

    @property()
    csvMapping!: NamedNode

    @property.literal({ path: schema.name })
    name!: string
  }

  return Impl
}

TableMixin.appliesTo = cc.Table
TableMixin.Class = TableMixin(RdfResource)
