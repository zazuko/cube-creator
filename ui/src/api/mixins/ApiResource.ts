import { Constructor } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'

declare module 'alcaeus/Resources' {
  export interface HydraResource {
    clientPath: string
  }
}

export function apiResourceMixin (rootUrl: string, separator: string): Mixin {
  function ApiResourceMixin<Base extends Constructor> (base: Base) {
    class BaseClass extends base {
      get clientPath () {
        return this.id.value.replace(rootUrl, '').replace('/', separator)
      }
    }

    return BaseClass
  }

  ApiResourceMixin.shouldApply = true

  return ApiResourceMixin
}
