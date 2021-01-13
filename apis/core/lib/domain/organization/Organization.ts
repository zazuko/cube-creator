import { NamedNode, Term } from 'rdf-js'
import { Constructor } from '@tpluscode/rdfine'
import { Organization } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import { DomainError } from '../../errors'

interface ApiOrganization {
  updateNamespace(newNamespace: NamedNode | undefined): NamedNode
  updatePublishGraph(publishGraph: Term | undefined): void
}

declare module '@rdfine/schema' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Organization extends ApiOrganization {
  }
}

export default function Mixin<Base extends Constructor<Omit<Organization, keyof ApiOrganization>>>(Resource: Base) {
  class Organization extends Resource implements ApiOrganization {
    updateNamespace(newNamespace: NamedNode | undefined) {
      if (!newNamespace) {
        throw new DomainError('Namespace cannot be empty')
      }

      if (!this.namespace.equals(newNamespace)) {
        const current = this.namespace
        this.namespace = newNamespace
        return current
      }

      return this.namespace
    }

    updatePublishGraph(publishGraph: Term | undefined) {
      if (!publishGraph || publishGraph.termType !== 'NamedNode') {
        throw new DomainError(`Invalid publish graph. Expended NamedNode, got ${publishGraph?.termType}`)
      }

      if (publishGraph.equals(this.publishGraph)) {
        return
      }

      this.publishGraph = publishGraph
    }
  }

  return Organization
}

Mixin.appliesTo = schema.Organization
