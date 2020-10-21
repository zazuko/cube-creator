import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { CSVMapping, SourcesCollection, TableCollection } from '@/types'

export default function Mixin<Base extends Constructor<Resource>> (base: Base) {
  return class extends base implements CSVMapping {
    get actions () {
      return {
      }
    }

    get sourcesCollection (): SourcesCollection {
      return this.get<SourcesCollection>(ns.cc.csvSourceCollection)
    }

    get tableCollection (): TableCollection {
      return this.get<TableCollection>(ns.cc.tables)
    }
  }
}

Mixin.appliesTo = ns.cc.CsvMapping
