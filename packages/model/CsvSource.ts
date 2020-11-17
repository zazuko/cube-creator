import * as Schema from '@rdfine/schema'
import * as Csvw from '@rdfine/csvw'
import RdfResourceImpl, { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { MediaObjectMixin } from '@rdfine/schema'
import { DialectMixin } from '@rdfine/csvw'
import { initializer } from './lib/initializer'
import { Link } from './lib/Link'
import { CsvMapping } from './CsvMapping'
import { CsvColumn, CsvColumnMixin } from './CsvColumn'
import { Collection } from '@rdfine/hydra'

export interface CsvSource extends RdfResource {
  associatedMedia: Schema.MediaObject
  name: string
  dialect: Csvw.Dialect
  csvMapping: Link<CsvMapping>
  columns: CsvColumn[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SourcesCollection extends Collection<CsvSource> {

}

export function CsvSourceMixin<Base extends Constructor>(base: Base): Mixin {
  class Impl extends base implements Partial<CsvSource> {
    @property.resource({ path: schema.associatedMedia, as: [MediaObjectMixin] })
    associatedMedia!: Schema.MediaObject

    @property.literal({ path: schema.name })
    name!: string

    @property.resource({ path: csvw.dialect, as: [DialectMixin] })
    dialect!: Csvw.Dialect

    @property.resource({ path: cc.csvMapping })
    csvMapping!: Link<CsvMapping>

    @property.resource({ path: csvw.column, values: 'array', as: [CsvColumnMixin] })
    columns!: CsvColumn[]
  }

  return Impl
}

CsvSourceMixin.appliesTo = cc.CSVSource
CsvSourceMixin.Class = CsvSourceMixin(RdfResourceImpl)

type RequireProperties = 'name' | 'csvMapping'

export const create = initializer<CsvSource, RequireProperties>(CsvSourceMixin, {
  types: [cc.CSVSource],
})
