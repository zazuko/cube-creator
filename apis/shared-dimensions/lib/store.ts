import { ASK, CONSTRUCT, DELETE, INSERT, WITH } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Term } from 'rdf-js'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { parsingClient } from './sparql'
import env from './env'
import { removeBnodes } from './rewrite'
import { extractShape, resourceQueryPatterns } from './resource'

export interface SharedDimensionsStore {
  graph: NamedNode
  load(id: Term | undefined): Promise<GraphPointer<NamedNode>>
  save(resource: GraphPointer<NamedNode>): Promise<void>
  delete(id: NamedNode): Promise<void>
  exists(id: NamedNode, type: NamedNode): Promise<boolean>
}

function deleteQuery(id: NamedNode, graph: NamedNode) {
  return WITH(graph, DELETE`
      ${id} ?rootProp ?rootObject .
      ${id} ${sh.node} ?rootShape .

      ?child ?childProp ?childObject .
      ?s ?p ?o .
    `
    .WHERE`
      ${resourceQueryPatterns(id, false)}

      OPTIONAL {
        ?rootShape (!${sh.targetNode})* ?s .
        ?s ?p ?o
      }
    `)
}

export function getQuery(id: NamedNode, graph: NamedNode) {
  return CONSTRUCT`
    ${id} ?rootProp ?rootObject .
    ?child ?childProp ?childObject .
  `
    .FROM(graph)
    .WHERE`${resourceQueryPatterns(id, true)}`
}

export default class Store implements SharedDimensionsStore {
  constructor(private client: ParsingClient, public graph: NamedNode) {
  }

  async load(term: NamedNode) {
    const quads = await getQuery(term, this.graph).execute(this.client.query)
    return clownface({ dataset: $rdf.dataset(quads), term })
  }

  delete(id: NamedNode) {
    return deleteQuery(id, this.graph).execute(this.client.query)
  }

  save(resource: GraphPointer<NamedNode>): Promise<void> {
    const withoutBlanks = removeBnodes(resource)

    const shape = extractShape(withoutBlanks)

    const insert = INSERT.DATA`GRAPH ${this.graph} {
      ${withoutBlanks.dataset}
      ${shape.dataset}
    }`
    const query = sparql`${deleteQuery(withoutBlanks.term, this.graph)};\n${insert}`

    return this.client.query.update(query.toString())
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
