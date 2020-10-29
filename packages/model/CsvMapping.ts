import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { Collection } from '@rdfine/hydra'
import { cc } from '@cube-creator/core/namespace'
import { CsvSource } from './CsvSource'
import { Table } from './Table'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'

export interface CsvMapping extends RdfResourceCore {
  sources: CsvSource[]
  sourcesCollection: Link<Collection<CsvSource>>
  tableCollection: Link<Collection<Table>>
}

export function CsvMappingMixin<Base extends Constructor>(base: Base) {
  class Impl extends base implements Partial<CsvMapping> {
    @property.resource({ path: cc.csvSource, values: 'array' })
    sources!: CsvSource[]

    @property.resource({ path: cc.csvSourceCollection })
    sourcesCollection!: Link<Collection<CsvSource>>

    @property.resource({ path: cc.tables })
    tableCollection!: Link<Collection<Table>>
  }

  return Impl
}

CsvMappingMixin.appliesTo = cc.CsvMapping

export const create = initializer<CsvMapping>(CsvMappingMixin)
