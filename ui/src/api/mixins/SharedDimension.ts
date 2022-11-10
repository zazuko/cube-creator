import { Constructor, property } from '@tpluscode/rdfine'
import { md, meta } from '@cube-creator/core/namespace'
import { NamedNode, Term } from 'rdf-js'
import { Hierarchy } from '@/store/types'
import { ThingMixin } from '@rdfine/schema'
import { Resource } from 'alcaeus'
import { schema } from '@tpluscode/rdf-ns-builders/strict'

export default function mixin<Base extends Constructor> (base: Base) {
  class Impl extends ThingMixin(base) implements Partial<Hierarchy> {
    @property({ path: schema.name, values: 'array' })
    names!: Term[]

    @property({ path: schema.alternateName, values: 'array' })
    abbreviation!: Term[]

    @property({ path: md.terms })
    terms?: NamedNode

    @property.resource({ path: md.export })
    export?: Resource

    @property.literal({ path: schema.validThrough, type: Date })
    validThrough?: Date
  }

  return Impl
}

mixin.appliesTo = meta.SharedDimension
