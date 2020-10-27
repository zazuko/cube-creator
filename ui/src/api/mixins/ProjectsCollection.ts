import { Collection } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { commonActions, findOperation } from '../common'
import { ProjectsCollection } from '@/types'

export default function Mixin<Base extends Constructor<Collection>> (base: Base) {
  return class extends base implements ProjectsCollection {
    get actions () {
      return {
        ...commonActions(this),
        create: findOperation(this, ns.cc.CreateProjectAction),
      }
    }
  }
}

Mixin.appliesTo = ns.cc.ProjectsCollection
