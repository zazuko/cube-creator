import { NamedNode } from 'rdf-js'
import { Constructor, property } from '@tpluscode/rdfine'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { Dictionary } from '@rdfine/prov'
import { cc } from '@cube-creator/core/namespace'

declare module '@rdfine/prov' {
  interface Dictionary {
    about: NamedNode
    managedDimension: NamedNode
  }
}

export function ProvDictionaryMixinEx<Base extends Constructor<Dictionary>>(Resource: Base) {
  class ProvDictionaryEx extends Resource {
    @property({ path: schema.about })
    about!: NamedNode

    @property({ path: cc.managedDimension })
    managedDimension!: NamedNode
  }

  return ProvDictionaryEx
}

ProvDictionaryMixinEx.appliesTo = prov.Dictionary
