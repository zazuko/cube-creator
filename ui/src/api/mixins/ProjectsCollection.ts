import { Collection } from 'alcaeus'
import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import * as ns from '@cube-creator/core/namespace'
import { commonActions } from '../common'
import { Project, ProjectsCollection } from '@/types'

export default function mixin<Base extends Constructor<Collection<Project>>> (base: Base): Mixin {
  return class extends base implements ProjectsCollection {
    get actions () {
      return commonActions(this)
    }
  }
}

mixin.appliesTo = ns.cc.ProjectsCollection
