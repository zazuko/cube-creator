import { Collection } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { SourcesCollection, Source } from '@/types'
import { commonActions, findOperation } from '../common'

export default function mixin<Base extends Constructor<Collection<Source>>> (base: Base): Mixin {
  return class extends base implements SourcesCollection {
    get actions () {
      return {
        ...commonActions(this),
        upload: findOperation(this, ns.cc.UploadCSVAction),
      }
    }
  }
}

mixin.appliesTo = ns.cc.CSVSourceCollection
