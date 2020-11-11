import { Collection } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { JobCollection, Job } from '@/types'
import { commonActions, findOperation } from '../common'

export default function mixin<Base extends Constructor<Collection<Job>>> (base: Base): Mixin {
  return class extends base implements JobCollection {
    get actions () {
      return {
        ...commonActions(this),
        create: findOperation(this, ns.cc.TransformAction)
      }
    }
  }
}

mixin.appliesTo = ns.cc.JobCollection
