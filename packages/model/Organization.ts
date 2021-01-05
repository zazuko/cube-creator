import { NamedNode } from 'rdf-js'
import type { Organization } from '@rdfine/schema'
import { Constructor, namespace, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

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

OrganizationMixin.appliesTo = schema.Organisation
