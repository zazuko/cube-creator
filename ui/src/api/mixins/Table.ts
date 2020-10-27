import { Resource } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Table, Source, ColumnMapping } from '@/types'
import { findOperation } from '../common'

export default function Mixin<Base extends Constructor<Resource>> (base: Base) {
  return class extends base implements Table {
    get actions () {
      return {
        delete: findOperation(this, schema.DeleteAction),
        edit: findOperation(this, schema.UpdateAction),
      }
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

Mixin.appliesTo = ns.cc.Table
