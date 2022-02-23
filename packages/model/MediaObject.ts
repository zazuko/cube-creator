import type { DatasetCore, NamedNode } from 'rdf-js'
import type * as Schema from '@rdfine/schema'
import RdfResourceImpl, { Initializer, RdfResourceCore, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { MediaObjectMixin as SchemaMediaObjectMixin } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'

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

export const fromPointer = <D extends DatasetCore>(pointer: GraphPointer<ResourceIdentifier, D>, initializer: Initializer<Schema.MediaObject<D>> = {}): Schema.MediaObject<D> => {
  return RdfResourceImpl.factory.createEntity(pointer, [MediaObjectMixin, SchemaMediaObjectMixin], {
    initializer: {
      ...initializer,
      types: [schema.MediaObject],
    },
  })
}
