import type StreamClient from 'sparql-http-client/StreamClient'
import { NamedNode } from 'rdf-js'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import ToQuadsTransform from 'rdf-transform-triple-to-quad'
import { CONSTRUCT } from '@tpluscode/sparql-builder'

export interface ResourceStore {
  get(id: string | NamedNode, throwWhenNotFound: boolean): Promise<GraphPointer<NamedNode>>
  put(pointer: GraphPointer): Promise<void>
}

export default class implements ResourceStore {
  private readonly __client: StreamClient

  constructor(client: StreamClient) {
    this.__client = client
  }

  /**
   * Gets all triples from a named graph and returns a graph pointer to a resource
   * identified by the same URI
   *
   * @param id
   */
  async get(id: string | NamedNode): Promise<GraphPointer<NamedNode>> {
    const term = typeof id === 'string' ? $rdf.namedNode(id) : id

    const stream = await CONSTRUCT`?s ?p ?o`
      .WHERE`GRAPH ${term} { ?s ?p ?o }`
      .execute(this.__client.query)

    const dataset = await $rdf.dataset().import(stream)

    return cf({ dataset, term })
  }

  /**
   * Replaces the resource in the triple store by inserting default graph
   * quads from the in-memory dataset into a named graph identified by the
   * graph pointer
   *
   * @param pointer Resource to store
   */
  put(pointer: GraphPointer<NamedNode>): Promise<void> {
    const defaultGraphTriples = $rdf.dataset([
      ...pointer.dataset
        .match(null, null, null, $rdf.defaultGraph()),
    ])

    return this.__client.store.put(defaultGraphTriples.toStream().pipe(new ToQuadsTransform(pointer.term)))
  }
}
