import RdfResource, { Constructor, namespace, property } from '@tpluscode/rdfine'
import type * as Csvw from '@rdfine/csvw'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { CsvSource } from './CsvSource'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { CsvMapping } from './CsvMapping'
import { childResource } from './lib/resourceIdentifiers'

export interface Table extends RdfResourceCore {
  csvw: Link<Csvw.Table>
  csvSource: Link<CsvSource>
  name: string
  csvMapping: Link<CsvMapping>
  identifierTemplate: string
  color: string
}

export function TableMixin<Base extends Constructor>(base: Base) {
  @namespace(cc as any)
  class Impl extends base implements Partial<Table> {
    @property.resource({ initial: childResource('csvw') })
    csvw!: Link<Csvw.Table>

    @property.resource()
    csvSource!: Link<CsvSource>

    @property.resource()
    csvMapping!: Link<CsvMapping>

    @property.literal({ path: schema.name })
    name!: string

    @property.literal()
    identifierTemplate!: string

    @property.literal({ path: schema.color })
    color!: string
  }

  return Impl
}

TableMixin.appliesTo = cc.Table
TableMixin.Class = TableMixin(RdfResource)

type RequiredProperties = 'name' | 'csvSource' | 'csvMapping' | 'identifierTemplate'

export const create = initializer<Table, RequiredProperties>(TableMixin, {
  types: [cc.Table],
})
