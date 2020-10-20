import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { Collection } from '@rdfine/hydra'
import { CsvSource } from './CsvSource'
import { Table } from './Table'
import { cc } from '@cube-creator/core/namespace'

export interface CsvMapping extends RdfResourceCore {
  sources: CsvSource[]
  tables: Collection<Table>
}

export function CsvMappingMixin<Base extends Constructor>(base: Base) {
  class Impl extends base implements CsvMapping {
    @property.resource({ path: cc.csvSource, values: 'array' })
    sources!: CsvSource[]

    @property.resource({ path: cc.tables })
    tables!: Collection<Table>
  }

  return Impl
}

CsvMappingMixin.appliesTo = cc.CsvMapping
