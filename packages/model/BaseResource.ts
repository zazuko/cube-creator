import { Constructor, namespace, property, RdfResource } from '@tpluscode/rdfine'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { schema } from '@tpluscode/rdf-ns-builders'
import * as Schema from '@rdfine/schema'
import { cc } from '../core/namespace'

declare module '@tpluscode/rdfine/RdfResource' {
  interface RdfResourceCore {
    errors?: Schema.Thing[]
  }
}

export function BaseResourceMixin<Base extends Constructor>(base: Base): Constructor<Partial<RdfResource> & RdfResourceCore> & Base {
  @namespace(cc)
  class Impl extends base implements Partial<RdfResource> {
    @property.resource({
      path: schema.error,
      values: 'array',
      as: [Schema.ThingMixin],
      filter: term => term.termType === 'NamedNode' || term.termType === 'BlankNode',
    })
    errors!: Schema.Thing[]
  }

  return Impl
}

BaseResourceMixin.shouldApply = true
