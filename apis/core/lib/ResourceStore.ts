import type StreamClient from 'sparql-http-client/StreamClient'
import { NamedNode, Stream } from 'rdf-js'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
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
  get(id: string | ResourceIdentifier): Promise<GraphPointer<NamedNode, DatasetExt> | undefined>

  /**
   * Creates a new resource a puts in the in-memory store
   */
  create(id: NamedNode, options?: ResourceCreationOptions): GraphPointer<NamedNode, DatasetExt>

  /**
   * Create a new collection member, initialized according to `hydra:manages` entries
   */
  createMember(collection: NamedNode, id: NamedNode, options?: ResourceCreationOptions): Promise<GraphPointer<NamedNode, DatasetExt>>

  /**
   * Replaces the resources in the triple store by inserting default graph
   * quads from each graph pointer into a named graph identified by that
   * graph pointer
   */
  save(): Promise<void>

  /**
   * Removes the named graph from the triple store
   */
  delete(id: NamedNode): void
}

interface TripleStoreFacade {
  loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, DatasetExt> | undefined>
  writeResources(stream: Stream): Promise<void>
  deleteResources(terms: Iterable<NamedNode>): Promise<void>
}

class SparqlStoreFacade implements TripleStoreFacade {
  private readonly __client: StreamClient

  constructor(client: StreamClient) {
    this.__client = client
  }

  async loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, DatasetExt>> {
    const stream = await CONSTRUCT`?s ?p ?o`
      .WHERE`GRAPH ${term} { ?s ?p ?o }`
      .execute(this.__client.query)

    return cf({ dataset: await $rdf.dataset().import(stream), term })
  }

  async deleteResources(terms: Iterable<NamedNode>): Promise<void> {
    let deleteQuery = ''
    for (const id of terms) {
      deleteQuery += turtle`DROP GRAPH ${id}; `.toString()
    }

    await this.__client.query.update(deleteQuery)
  }

  writeResources(stream: Stream): Promise<void> {
    return this.__client.store.put(stream)
  }
}

export default class implements ResourceStore {
  private readonly __storage: TripleStoreFacade
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode, DatasetExt>>
  private readonly __deletedGraphs: TermSet<NamedNode>

  constructor(clientOrStore: StreamClient | TripleStoreFacade) {
    this.__storage = 'store' in clientOrStore ? new SparqlStoreFacade(clientOrStore) : clientOrStore
    this.__resources = new TermMap()
    this.__deletedGraphs = new TermSet()
  }

  async get(id: string | NamedNode): Promise<GraphPointer<NamedNode, DatasetExt> | undefined> {
    const term = typeof id === 'string' ? $rdf.namedNode(id) : id
    if (!this.__resources.has(term)) {
      const resource = await this.__storage.loadResource(term)
      if (resource) {
        this.__resources.set(term, resource)
      }
    }

    return this.__resources.get(term)
  }

  async save(): Promise<void> {
    const streams = [...this.__resources.values()].map(pointer => {
      const defaultGraphTriples = [
        ...pointer.dataset
          .match(null, null, null, $rdf.defaultGraph()),
      ]

      return $rdf.dataset(defaultGraphTriples).toStream().pipe(new ToQuadsTransform(pointer.term))
    })

    await this.__storage.writeResources(mergeStreams(streams) as any)

    if (this.__deletedGraphs.size > 0) {
      await this.__storage.deleteResources(this.__deletedGraphs)
      this.__deletedGraphs.clear()
    }
  }

  create(id: NamedNode, { implicitlyDereferencable = true }: ResourceCreationOptions = {}): GraphPointer<NamedNode, DatasetExt> {
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

  async createMember(collectionId: NamedNode, id: NamedNode, options?: ResourceCreationOptions): Promise<GraphPointer<NamedNode, DatasetExt>> {
    const member = this.create(id, options)
    const collection = await this.get(collectionId)

    if (!collection) {
      throw new Error(`Collection <${collectionId}> not found`)
    }

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

  delete(id: NamedNode): void {
    this.__deletedGraphs.add(id)
  }
}
