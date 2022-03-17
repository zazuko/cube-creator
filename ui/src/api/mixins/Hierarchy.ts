import { Constructor, property } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { meta } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders/strict'

export default function mixin<Base extends Constructor> (base: Base): Mixin {
  class Impl extends base {
    @property.literal({ path: schema.name })
    name!: string
  }

  return Impl
}

mixin.appliesTo = meta.Hierarchy
