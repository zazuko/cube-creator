import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'

declare module '@tpluscode/rdfine' {
  export interface RdfResource {
    clientPath: string
  }
}

export function apiResourceMixin (rootUrl: string, separator: string): Mixin {
  function ApiResourceMixin<Base extends Constructor> (base: Base) {
    class BaseClass extends base {
      get clientPath () {
        return this.id.value.replace(rootUrl, '').replaceAll('/', separator)
      }
    }

    return BaseClass
  }

  ApiResourceMixin.shouldApply = true

  return ApiResourceMixin
}
