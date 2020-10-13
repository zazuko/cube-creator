import { Resource } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Source } from '@/types'

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
  }
}

Mixin.appliesTo = ns.cc.CSVSource
