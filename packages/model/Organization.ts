import { DatasetCore, NamedNode } from 'rdf-js'
import { Organization, OrganizationMixin as SchemaOrganizationMixin } from '@rdfine/schema'
import { Constructor, namespace, property, ResourceIdentifier } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import RdfResourceImpl, { Initializer, RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import type { GraphPointer } from 'clownface'

interface OrganizationEx {
  publishGraph: NamedNode
  namespace: NamedNode
}

declare module '@rdfine/schema' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Organization extends OrganizationEx {}
}

export function OrganizationMixin<Base extends Constructor<Omit<Organization, keyof OrganizationEx>>>(Resource: Base): Constructor<RdfResourceCore & OrganizationEx> & Base {
  @namespace(cc)
  class Impl extends Resource implements OrganizationEx {
    @property()
    publishGraph!: NamedNode

    @property()
    namespace!: NamedNode
  }

  return Impl
}

OrganizationMixin.appliesTo = schema.Organization

export const fromPointer = <D extends DatasetCore>(pointer: GraphPointer<ResourceIdentifier, D>, initializer: Initializer<Organization<D>> = {}): Organization<D> => {
  return RdfResourceImpl.factory.createEntity(pointer, [OrganizationMixin, SchemaOrganizationMixin], {
    initializer: {
      ...initializer,
      types: [schema.Organization],
    },
  })
}
