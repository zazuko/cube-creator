import type { NamedNode } from '@rdfjs/types'
import type * as Schema from '@rdfine/schema'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { RdfineEnvironment } from '@tpluscode/rdfine/environment'
import { createFactory } from '@tpluscode/rdfine/factory'

export interface MediaObjectEx {
  sourceKind: NamedNode
}

declare module '@rdfine/schema' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MediaObject extends MediaObjectEx {}
}

export function MediaObjectMixin<Base extends Constructor<Omit<Schema.MediaObject, keyof MediaObjectEx>>>(Resource: Base): Constructor<RdfResourceCore & MediaObjectEx> & Base {
  class Impl extends Resource implements MediaObjectEx {
    @property({ path: cc.sourceKind })
    sourceKind!: NamedNode
  }

  return Impl
}

MediaObjectMixin.appliesTo = schema.MediaObject
MediaObjectMixin.createFactory = (env: RdfineEnvironment) => createFactory<Schema.MediaObject>([MediaObjectMixin], { types: [schema.MediaObject] }, env)
