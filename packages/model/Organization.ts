import type { NamedNode, Term } from '@rdfjs/types'
import type { Organization } from '@rdfine/schema'
import { Constructor, namespace, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { dcat, schema, _void } from '@tpluscode/rdf-ns-builders'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { RdfineEnvironment } from '@tpluscode/rdfine/environment'
import { createFactory } from '@tpluscode/rdfine/factory'

export type { Organization } from '@rdfine/schema'

interface CreateIdentifier {
  cubeIdentifier: string
  termName?: string | Term
}

interface OrganizationEx {
  publishGraph: NamedNode
  namespace: NamedNode
  dataset?: NamedNode
  accessURL: NamedNode
  sparqlEndpoint: NamedNode
  createIdentifier(params: CreateIdentifier): NamedNode
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

    @property({ path: schema.dataset })
    dataset?: NamedNode

    @property({ path: dcat.accessURL })
    accessURL!: NamedNode

    @property({ path: _void.sparqlEndpoint })
    sparqlEndpoint!: NamedNode

    createIdentifier({ cubeIdentifier, termName }: CreateIdentifier): NamedNode {
      const namespace = this.namespace.value.match(/[/#]$/) ? this.namespace.value : `${this.namespace.value}/`
      let base = namespace + cubeIdentifier

      if (!termName) {
        return this.pointer.namedNode(base).term
      }

      if (!base.match(/[/#]$/)) {
        base += '/'
      }

      if (typeof termName === 'string') {
        return this.pointer.namedNode(base + termName).term
      }

      if (termName.termType === 'Literal') {
        return this.pointer.namedNode(base + termName.value).term
      }
      if (termName.termType === 'NamedNode') {
        return termName
      }

      throw new Error(`Unexpected identifier template type ${termName.termType}`)
    }
  }

  return Impl
}

OrganizationMixin.appliesTo = schema.Organization
OrganizationMixin.createFactory = (env: RdfineEnvironment) => createFactory<Organization>([OrganizationMixin], { types: [schema.Organization] }, env)
