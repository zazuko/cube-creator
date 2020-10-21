import { Resource } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { CSVMapping, SourcesCollection, TableCollection } from '@/types'

export type Constructor = new (...args: any[]) => Resource;

export default function Mixin<Base extends Constructor> (base: Base) {
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
