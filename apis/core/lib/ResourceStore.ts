import type StreamClient from 'sparql-http-client/StreamClient'
import { NamedNode } from 'rdf-js'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import ToQuadsTransform from 'rdf-transform-triple-to-quad'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import TermMap from '@rdfjs/term-map'
import mergeStreams from 'merge-stream'

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
  get(id: string | NamedNode): Promise<GraphPointer<NamedNode>>

  /**
   * Creates a new resource a puts in the in-memory store
   */
  create(id: NamedNode): GraphPointer<NamedNode>

  /**
   * Replaces the resources in the triple store by inserting default graph
   * quads from each graph pointer into a named graph identified by that
   * graph pointer
   */
  save(): Promise<void>
}

export default class implements ResourceStore {
  private readonly __client: StreamClient
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode>>

  constructor(client: StreamClient) {
    this.__client = client
    this.__resources = new TermMap()
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

  save(): Promise<void> {
    const streams = [...this.__resources.values()].map(pointer => {
      const defaultGraphTriples = [
        ...pointer.dataset
          .match(null, null, null, $rdf.defaultGraph()),
      ]

      return $rdf.dataset(defaultGraphTriples).toStream().pipe(new ToQuadsTransform(pointer.term))
    })

    return this.__client.store.put(mergeStreams(streams) as any)
  }

  create(id: NamedNode): GraphPointer<NamedNode> {
    if (this.__resources.has(id)) {
      throw new Error('Resource')
    }

    const pointer = cf({ dataset: $rdf.dataset(), term: id })
    this.__resources.set(id, pointer)
    return pointer
  }
}
