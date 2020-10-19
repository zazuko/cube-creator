import { Resource } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { schema, csvw } from '@tpluscode/rdf-ns-builders'
import { Source, CSVColumn } from '@/types'

export type Constructor = new (...args: any[]) => Resource;

export default function Mixin<Base extends Constructor> (base: Base) {
  return class extends base implements Source {
    get actions () {
      return {
      }
    }

    get name (): string {
      return this.getString(schema.name)
    }

    get columns (): CSVColumn[] {
      return this.getArray<CSVColumn>(csvw.column)
        .sort((c1, c2) => c1.order - c2.order)
    }
  }
}

Mixin.appliesTo = ns.cc.CSVSource
