import { Constructor, RdfResource } from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { findOperation } from '../common'

export default function Mixin<Base extends Constructor> (base: Base) {
  return class extends base {
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
