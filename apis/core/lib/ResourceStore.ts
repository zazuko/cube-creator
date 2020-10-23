import type StreamClient from 'sparql-http-client/StreamClient'
import { NamedNode } from 'rdf-js'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import ToQuadsTransform from 'rdf-transform-triple-to-quad'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import TermMap from '@rdfjs/term-map'
import mergeStreams from 'merge-stream'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { warn } from '@hydrofoil/labyrinth/lib/logger'
import { ResourceIdentifier } from '@tpluscode/rdfine'
import { turtle } from '@tpluscode/rdf-string'
import TermSet from '@rdfjs/term-set'

interface ResourceCreationOptions {
  implicitlyDereferencable?: boolean
}

/**
 * Represents an in-memory resource store where each resource is a graph pointer.
 * When the `save` method is called those resources are persisted in their respective
 * named graphs in a triple store
 */
export interface ResourceStore {
  /**
   * Gets all triples from a named graph and returns a graph pointer to a resource
   * identified by the same URI
   *
   * @param id
   */
  get(id: string | ResourceIdentifier): Promise<GraphPointer<NamedNode>>

  /**
   * Creates a new resource a puts in the in-memory store
   */
  create(id: NamedNode, options?: ResourceCreationOptions): GraphPointer<NamedNode>

  /**
   * Create a new collection member, initialized according to `hydra:manages` entries
   */
  createMember(collection: NamedNode, id: NamedNode, options?: ResourceCreationOptions): Promise<GraphPointer<NamedNode>>

  /**
   * Replaces the resources in the triple store by inserting default graph
   * quads from each graph pointer into a named graph identified by that
   * graph pointer
   */
  save(): Promise<void>

  /**
   * Removes the named graph from the triple store
   */
  delete(id: string | ResourceIdentifier): Promise<void>
}

export default class implements ResourceStore {
  private readonly __client: StreamClient
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode>>
  private readonly __termSet: TermSet

  constructor(client: StreamClient) {
    this.__client = client
    this.__resources = new TermMap()
    this.__termSet = new TermSet()
  }

  async get(id: string | NamedNode): Promise<GraphPointer<NamedNode>> {
    const term = typeof id === 'string' ? $rdf.namedNode(id) : id
    if (!this.__resources.has(term)) {
      const stream = await CONSTRUCT`?s ?p ?o`
        .WHERE`GRAPH ${term} { ?s ?p ?o }`
        .execute(this.__client.query)

      const dataset = await $rdf.dataset().import(stream)

      this.__resources.set(term, cf({ dataset, term }))
    }

    return this.__resources.get(term)!
  }

  async save(): Promise<void> {
    const streams = [...this.__resources.values()].map(pointer => {
      const defaultGraphTriples = [
        ...pointer.dataset
          .match(null, null, null, $rdf.defaultGraph()),
      ]

      return $rdf.dataset(defaultGraphTriples).toStream().pipe(new ToQuadsTransform(pointer.term))
    })

    await this.__client.store.put(mergeStreams(streams) as any)

    let deleteQuery = ''
    this.__termSet.forEach(id => {
      deleteQuery += turtle`DROP GRAPH ${id}; `.toString()
    })
    await this.__client.query.update(deleteQuery)
    this.__termSet.clear()
  }

  create(id: NamedNode, { implicitlyDereferencable = true }: ResourceCreationOptions = {}): GraphPointer<NamedNode> {
    if (this.__resources.has(id)) {
      throw new Error('Resource')
    }

    const pointer = cf({ dataset: $rdf.dataset(), term: id })

    if (implicitlyDereferencable) {
      pointer.addOut(rdf.type, hydra.Resource)
    }

    this.__resources.set(id, pointer)
    return pointer
  }

  async createMember(collectionId: NamedNode, id: NamedNode, options?: ResourceCreationOptions): Promise<GraphPointer<NamedNode>> {
    const member = this.create(id, options)
    const collection = await this.get(collectionId)

    collection.out(hydra.manages).forEach((manages) => {
      const property = manages.out(hydra.property).term
      const subject = manages.out(hydra.subject).term
      const object = manages.out(hydra.object).term

      if (object && subject) {
        warn('hydra:manages cannot have both subject and object. Got %s and %s respectively', subject.value, object.value)
        return
      }

      if (property && object) {
        member.addOut(property, object)
      } else if (property && subject) {
        member.addIn(property, subject)
      }
    })

    return member
  }

  async delete(id: NamedNode): Promise<void> {
    if (!this.__resources.has(id)) {
      throw new Error('Resource does not exist')
    }
    this.__termSet.add(id)
  }
}
