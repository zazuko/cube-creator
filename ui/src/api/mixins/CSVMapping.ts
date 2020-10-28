import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { CSVMapping, SourcesCollection, TableCollection } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<Resource>> (base: Base): Mixin {
  return class extends base implements CSVMapping {
    get actions () {
      return commonActions(this)
    }

    get sourcesCollection (): SourcesCollection {
      return this.get<SourcesCollection>(ns.cc.csvSourceCollection)
    }

    get tableCollection (): TableCollection {
      return this.get<TableCollection>(ns.cc.tables)
    }
  }
}

mixin.appliesTo = ns.cc.CsvMapping
