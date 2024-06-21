import type { DatasetCore } from '@rdfjs/types'
import { RdfResource, Constructor, namespace, property } from '@tpluscode/rdfine'
import { createFactory } from '@tpluscode/rdfine/factory'
import { RdfineEnvironment } from '@tpluscode/rdfine/environment'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import type * as Csvw from '@rdfine/csvw'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import type { Collection } from '@rdfine/hydra'
import { CsvSource } from './CsvSource.js'
import { Link } from './lib/Link.js'
import { initializer } from './lib/initializer.js'
import { CsvMapping } from './CsvMapping.js'
import { childResource } from './lib/resourceIdentifiers.js'
import { parse, ParsedTemplate } from './lib/uriTemplateParser.js'

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
TableMixin.createFactory = (env: RdfineEnvironment) => createFactory<Table>([TableMixin], { types: [cc.Table] }, env)

type RequiredProperties = 'name' | 'csvSource' | 'csvMapping'

export const create = initializer<Table, RequiredProperties>(TableMixin, {
  types: [cc.Table],
})
