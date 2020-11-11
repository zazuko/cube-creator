import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { schema, csvw, dtype } from '@tpluscode/rdf-ns-builders'
import { CSVColumn } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<CSVColumn>> (base: Base): Mixin {
  return class extends base implements CSVColumn {
    get actions () {
      return commonActions(this)
    }

    get name (): string {
      return this.getString(schema.name)
    }

    get order (): number {
      return this.getNumber(dtype.order) ?? Infinity
    }

    get sampleValues (): string[] {
      return this.pointer
        .out(ns.cc.csvColumnSample)
        .values
        .filter(Boolean)
    }
  }
}

mixin.appliesTo = csvw.Column
