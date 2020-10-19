import { Resource } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { schema, csvw, dtype } from '@tpluscode/rdf-ns-builders'
import { CSVColumn } from '@/types'

export type Constructor = new (...args: any[]) => Resource;

export default function Mixin<Base extends Constructor> (base: Base) {
  return class extends base implements CSVColumn {
    get actions () {
      return {}
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

Mixin.appliesTo = csvw.Column
