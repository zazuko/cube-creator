import { RdfResource } from '@tpluscode/rdfine'
import { Collection } from 'alcaeus'
import * as ns from '@cube-creator/core/namespace'
import { findOperation } from '../common'
import { ProjectsCollection } from '@/types'

export type Constructor = new (...args: any[]) => Collection;

export default function Mixin<Base extends Constructor> (base: Base) {
  return class extends base implements ProjectsCollection {
    get actions () {
      return {
        create: findOperation(this, ns.cc.CreateProjectAction),
      }
    }
  }
}

Mixin.shouldApply = function (resource: RdfResource): boolean {
  return resource.types.has(ns.cc.ProjectsCollection)
}
