import * as Schema from '@rdfine/schema'
import * as Csvw from '@rdfine/csvw'
import RdfResourceImpl, { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { MediaObjectMixin } from '@rdfine/schema'
import { DialectMixin } from '@rdfine/csvw'

export interface CsvSource extends RdfResourceCore {
  associatedMedia: Schema.MediaObject
  name: string
  dialect: Csvw.Dialect
}

export function CsvSourceMixin<Base extends Constructor>(base: Base) {
  class Impl extends base implements CsvSource {
    @property.resource({ path: schema.associatedMedia, as: [MediaObjectMixin] })
    associatedMedia!: Schema.MediaObject

    @property.literal({ path: schema.name })
    name!: string

    @property.resource({ path: csvw.dialect, as: [DialectMixin] })
    dialect!: Csvw.Dialect
  }

  return Impl
}

CsvSourceMixin.appliesTo = cc.CSVSource
CsvSourceMixin.Class = CsvSourceMixin(RdfResourceImpl)
