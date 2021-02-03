import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { CsvColumn } from '@cube-creator/model'
import { AdditionalActions } from '@/api/mixins/ApiResource'

export default function mixin<Base extends Constructor> (base: Base): Mixin {
  return class extends base implements AdditionalActions {
    get columns (): CsvColumn[] {
      return this.getArray<CsvColumn>(csvw.column)
        .sort((c1, c2) => c1.order - c2.order)
    }

    get _additionalActions () {
      return {
        replace: ns.cc.ReplaceCSVAction,
        download: schema.DownloadAction
      }
    }
  }
}

mixin.appliesTo = ns.cc.CSVSource
