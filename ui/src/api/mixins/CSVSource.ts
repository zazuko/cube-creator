import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { CsvSource, CsvColumn } from '@cube-creator/model'

export default function mixin<Base extends Constructor<CsvSource>> (base: Base): Mixin {
  return class extends base {
    get columns (): CsvColumn[] {
      return this.getArray<CsvColumn>(csvw.column)
        .sort((c1, c2) => c1.order - c2.order)
    }
  }
}

mixin.appliesTo = ns.cc.CSVSource
