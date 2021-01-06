import { NamedNode, Term } from 'rdf-js'
import { Constructor } from '@tpluscode/rdfine'
import { Organization } from '@rdfine/schema'
import { schema } from '@tpluscode/rdf-ns-builders'
import { DomainError } from '../../errors'

interface CreateIdentifier {
  cubeIdentifier: string
  termName?: string | Term
}

interface ApiOrganization {
  createIdentifier(params: CreateIdentifier): NamedNode
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
