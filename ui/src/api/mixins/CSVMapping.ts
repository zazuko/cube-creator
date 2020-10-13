import { Resource } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { CSVMapping, Source, SourcesCollection } from '@/types'

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
  }
}

Mixin.appliesTo = ns.cc.CsvMapping
