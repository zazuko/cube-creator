import { Resource } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Table, Source } from '@/types'
import { findOperation } from '../common'

export type Constructor = new (...args: any[]) => Resource;

export default function Mixin<Base extends Constructor> (base: Base) {
  return class extends base implements Table {
    get actions () {
      return {
        delete: findOperation(this, schema.DeleteAction),
      }
    }

    get name (): string {
      return this.getString(schema.name)
    }

    get source (): Source {
      return this.get<Source>(ns.cc.csvSource)
    }
  }
}

Mixin.appliesTo = ns.cc.Table
