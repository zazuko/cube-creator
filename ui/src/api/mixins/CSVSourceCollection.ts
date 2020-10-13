import { Collection } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { SourcesCollection } from '@/types'
import { findOperation } from '../common'

export type Constructor = new (...args: any[]) => Collection;

export default function Mixin<Base extends Constructor> (base: Base) {
  return class extends base implements SourcesCollection {
    get actions () {
      return {
        upload: findOperation(this, ns.cc.UploadCSVAction),
      }
    }
  }
}

Mixin.appliesTo = ns.cc.CSVSourceCollection
