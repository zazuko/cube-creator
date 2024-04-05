import { Constructor, namespace, property, RdfResource } from '@tpluscode/rdfine'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import type { GraphPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import * as Schema from '@rdfine/schema'
import { cc } from '../core/namespace.js'
import { JobErrorMixin } from './Job.js'

declare module '@tpluscode/rdfine/RdfResource' {
  interface RdfResourceCore {
    errors?: Schema.Thing[]
    addError?(error: ((arg: GraphPointer) => Schema.Thing)): void
    removeError?(id: string): void
  }
}

export function BaseResourceMixin<Base extends Constructor>(base: Base): Constructor<Partial<RdfResource> & RdfResourceCore> & Base {
  @namespace(cc)
  class Impl extends base implements Partial<RdfResource> {
    @property.resource({
      path: schema.error,
      values: 'array',
      as: [JobErrorMixin],
      filter: term => term.termType === 'NamedNode' || term.termType === 'BlankNode',
    })
    errors!: Schema.Thing[]

    addError(errorOrFactory: ((arg: GraphPointer) => Schema.Thing)) {
      const error = errorOrFactory(this.pointer.blankNode())

      if (this.errors.some(current => current.identifierLiteral === error.identifierLiteral)) {
        return
      }

      this.errors = [
        ...this.errors,
        error,
      ]
    }

    removeError(id: string) {
      this.pointer
        .out(schema.error)
        .has(schema.identifier, id)
        .deleteOut()
        .deleteIn()
    }
  }

  return Impl
}

BaseResourceMixin.shouldApply = true
