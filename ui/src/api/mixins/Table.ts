import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Table, Source, ColumnMapping } from '@/types'
import { commonActions } from '../common'

export default function mixin<Base extends Constructor<Resource>> (base: Base): Mixin {
  return class extends base implements Table {
    get actions () {
      return commonActions(this)
    }

    get isObservationTable (): boolean {
      return this.types.has(ns.cc.ObservationTable)
    }

    get name (): string {
      return this.getString(schema.name)
    }

    get color (): string {
      return this.getString(schema.color)
    }

    get source (): Source {
      return this.get<Source>(ns.cc.csvSource)
    }

    get columnMappings (): ColumnMapping[] {
      return this.getArray<ColumnMapping>(ns.cc.columnMapping)
    }
  }
}

mixin.appliesTo = ns.cc.Table
