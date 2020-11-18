import RdfResourceImpl, { RdfResource, Constructor, namespace, property } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import type * as Csvw from '@rdfine/csvw'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { CsvSource } from './CsvSource'
import { Collection } from '@rdfine/hydra'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { CsvMapping } from './CsvMapping'
import { childResource } from './lib/resourceIdentifiers'
import { ColumnMapping } from './ColumnMapping'

export interface Table extends RdfResource {
  csvw: Link<Csvw.Table>
  csvSource?: Link<CsvSource>
  name: string
  csvMapping: Link<CsvMapping>
  identifierTemplate: string
  color: string
  columnMappings: ColumnMapping[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TableCollection extends Collection<Table> {

}

export function TableMixin<Base extends Constructor>(base: Base): Mixin {
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
TableMixin.Class = TableMixin(RdfResourceImpl)

type RequiredProperties = 'name' | 'csvSource' | 'csvMapping' | 'identifierTemplate'

export const create = initializer<Table, RequiredProperties>(TableMixin, {
  types: [cc.Table],
})
