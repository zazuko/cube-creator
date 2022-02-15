import RdfResourceImpl, { RdfResource, Constructor, namespace, property, ResourceIdentifier } from '@tpluscode/rdfine'
import type { GraphPointer } from 'clownface'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import type * as Csvw from '@rdfine/csvw'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { CsvSource } from './CsvSource'
import type { Collection } from '@rdfine/hydra'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { CsvMapping } from './CsvMapping'
import { childResource } from './lib/resourceIdentifiers'
import { DatasetCore } from 'rdf-js'
import { parse, ParsedTemplate } from './lib/uriTemplateParser'

export interface Table<D extends DatasetCore = DatasetCore> extends RdfResource<D> {
  csvw: Link<Csvw.Table>
  csvSource?: Link<CsvSource>
  name: string
  csvMapping: Link<CsvMapping>
  identifierTemplate: string
  color: string
  isObservationTable: boolean
  parsedTemplate: ParsedTemplate
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TableCollection extends Collection<Table> {

}

export function TableMixin<Base extends Constructor>(base: Base): Mixin {
  @namespace(cc)
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
    identifierTemplate?: string

    @property.literal({ path: schema.color })
    color!: string

    get isObservationTable(): boolean {
      return this.types.has(cc.ObservationTable)
    }

    get parsedTemplate() {
      return parse(this.identifierTemplate ?? '')
    }
  }

  return Impl
}

TableMixin.appliesTo = cc.Table

export const fromPointer = (pointer: GraphPointer<ResourceIdentifier>): Table => {
  return RdfResourceImpl.factory.createEntity<Table>(pointer, [TableMixin])
}

type RequiredProperties = 'name' | 'csvSource' | 'csvMapping'

export const create = initializer<Table, RequiredProperties>(TableMixin, {
  types: [cc.Table],
})
