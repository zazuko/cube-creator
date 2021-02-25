import { CONSTRUCT, DELETE, INSERT, WITH } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Term } from 'rdf-js'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { sh } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { parsingClient } from './sparql'
import env from './env'

export interface ManagedDimensionsStore {
  load(id: Term | undefined): Promise<GraphPointer<NamedNode>>
  save(resource: GraphPointer<NamedNode>): Promise<void>
  delete(id: NamedNode): Promise<void>
}

function resourceQueryPatterns(id: NamedNode) {
  return sparql`
    ${id} ${sh.node} ?rootShape .

    ?rootShape ${sh.property}/${sh.path} ?rootProp .
    ${id} ?rootProp ?rootObject .

    OPTIONAL {
      ?rootShape (${sh.property}/${sh.node})+ ?childPropShape .
      ?childPropShape ${sh.targetNode} ?child .
      ?childPropShape ${sh.property}/${sh.path} ?childProp .
      ?child ?childProp ?childObject .
    }`
}

function deleteQuery(id: NamedNode, graph: NamedNode) {
  return WITH(graph, DELETE`
      ${id} ?rootProp ?rootObject .
      ${id} ${sh.node} ?rootShape .

      ?child ?childProp ?childObject .
      ?s ?p ?o .
    `
    .WHERE`
      ${resourceQueryPatterns(id)}
    `)
}

export function getQuery(id: NamedNode, graph: NamedNode) {
  return CONSTRUCT`
    ${id} ?rootProp ?rootObject .
    ?child ?childProp ?childObject .
  `
    .FROM(graph)
    .WHERE`${resourceQueryPatterns(id)}`
}

export default class Store implements ManagedDimensionsStore {
  constructor(private client: ParsingClient, private graph: NamedNode) {
  }

  async load(term: NamedNode) {
    const quads = await getQuery(term, this.graph).execute(this.client.query)
    return clownface({ dataset: $rdf.dataset(quads), term })
  }

  delete(id: NamedNode) {
    return deleteQuery(id, this.graph).execute(this.client.query)
  }

  save(resource: GraphPointer<NamedNode>): Promise<void> {
    const shape = this.extractShape(resource)
    shape.addIn(sh.node, resource)

    const insert = INSERT.DATA`GRAPH ${this.graph} {
      ${resource.dataset}
      ${shape.dataset}
    }`
    const query = sparql`${deleteQuery(resource.term, this.graph)};\n${insert}`

    return this.client.query.update(query.toString())
  }

  extractShape(resource: GraphPointer, dataset = $rdf.dataset(), visited = new TermSet()): GraphPointer {
    const shape = clownface({ dataset }).blankNode()
    if (visited.has(resource.term)) {
      return shape
    }

    visited.add(resource.term)
    if (!resource.out().terms.length) {
      return shape
    }

    shape.addOut(sh.targetNode, resource.term)
    for (const quad of resource.dataset.match(resource.term)) {
      shape.addOut(sh.property, property => {
        property.addOut(sh.path, quad.predicate)

        if (quad.object.termType === 'NamedNode' || quad.object.termType === 'BlankNode') {
          const childShape = this.extractShape(resource.node(quad.object), dataset, visited)

          if (childShape.out().terms.length) {
            property.addOut(sh.node, childShape)
          }
        }
      })
    }

    return shape
  }
}

export function store(): ManagedDimensionsStore {
  return new Store(parsingClient, $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
}
