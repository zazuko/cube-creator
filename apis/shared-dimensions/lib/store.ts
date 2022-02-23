import { NamedNode, Term } from 'rdf-js'
import { ASK, INSERT } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import clownface, { GraphPointer } from 'clownface'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { parsingClient } from './sparql'
import env from './env'
import { removeBnodes } from './rewrite'
import { extractShape, deleteShapesQuery, deleteQuery, resourceQuery } from './resource'

export { resourceQuery } from './resource'

export interface SharedDimensionsStore {
  graph: NamedNode
  load(id: Term | undefined): Promise<GraphPointer<NamedNode>>
  save(resource: GraphPointer<NamedNode>): Promise<void>
  delete(id: NamedNode): Promise<void>
  exists(id: NamedNode, type: NamedNode): Promise<boolean>
}

export default class Store implements SharedDimensionsStore {
  constructor(private client: ParsingClient, public graph: NamedNode) {
  }

  async load(term: NamedNode) {
    const query = await resourceQuery(term, this.graph, this.client)
    const quads = await query.execute(this.client.query, { operation: 'postUrlencoded' })
    return clownface({ dataset: $rdf.dataset(quads), term })
  }

  async delete(id: NamedNode) {
    const deleteRepresentation = await deleteQuery(id, this.graph, this.client)
    const pruneShapes = deleteShapesQuery(id, this.graph)

    const query = sparql`${deleteRepresentation};\n${pruneShapes}`
    await this.client.query.update(query.toString())
  }

  async save(resource: GraphPointer<NamedNode>): Promise<void> {
    const withoutBlanks = removeBnodes(resource)

    const shape = extractShape(withoutBlanks)

    const pruneShapes = deleteShapesQuery(withoutBlanks.term, this.graph)

    const insert = INSERT.DATA`GRAPH ${this.graph} {
      ${withoutBlanks.dataset}
      ${shape.dataset}
    }`
    const deleteRepresentation = await deleteQuery(withoutBlanks.term, this.graph, this.client)
    const query = sparql`
    # Delete previous resource triples
    ${deleteRepresentation};
    # Remove resource shapes
    ${pruneShapes};
    # Insert new shape and resource
    ${insert}`

    await this.client.query.update(query.toString())
  }

  exists(id: NamedNode, type: NamedNode) {
    return ASK`
      ${id} ${rdf.type} ${type} .
      ?shape ${sh.targetNode} ${id} .
    `.FROM(this.graph).execute(this.client.query)
  }
}

export function store(client = parsingClient): SharedDimensionsStore {
  return new Store(client, $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
}
