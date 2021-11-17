import { ASK, CONSTRUCT, DELETE, INSERT, WITH } from '@tpluscode/sparql-builder'
import { sparql } from '@tpluscode/rdf-string'
import clownface, { GraphPointer } from 'clownface'
import { BlankNode, NamedNode, Term } from 'rdf-js'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { nanoid } from 'nanoid'
import { parsingClient } from './sparql'
import env from './env'
import { removeBnodes } from './rewrite'

export interface SharedDimensionsStore {
  graph: NamedNode
  load(id: Term | undefined): Promise<GraphPointer<NamedNode>>
  save(resource: GraphPointer<NamedNode>): Promise<void>
  delete(id: NamedNode): Promise<void>
  exists(id: NamedNode, type: NamedNode): Promise<boolean>
}

function resourceQueryPatterns(id: NamedNode, strict: boolean) {
  let rootPropPatterns = sparql`${id} ?rootProp ?rootObject .`
  if (!strict) {
    rootPropPatterns = sparql`OPTIONAL { ${rootPropPatterns} }`
  }

  return sparql`
    ?rootShape ${sh.targetNode} ${id} .
    MINUS {
      # Exclude shapes which are children of property shapes
      ?propertyShape ${sh.node} ?rootShape .
    }

    OPTIONAL { ?rootShape ${sh.property}/${sh.path} ?rootProp . }
    ${rootPropPatterns}

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

function isResource(arg: Term): arg is NamedNode | BlankNode {
  return arg.termType === 'BlankNode' || arg.termType === 'NamedNode'
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

    const shape = this.extractShape(withoutBlanks)
    shape.addOut(sh.targetNode, withoutBlanks)

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

  extractShape(resource: GraphPointer, dataset = $rdf.dataset(), visited = new TermSet()): GraphPointer {
    const shape = clownface({ dataset }).namedNode(`urn:shape:${nanoid()}`)
    if (visited.has(resource.term)) {
      return shape
    }

    visited.add(resource.term)
    if (!resource.out().terms.length) {
      return shape
    }

    shape.addOut(sh.targetNode, resource.term)
    const visitedPredicates = new TermSet()
    for (const { predicate, object } of resource.dataset.match(resource.term)) {
      if (!isResource(object) && visitedPredicates.has(predicate)) {
        continue
      }

      visitedPredicates.add(predicate)
      shape.addOut(sh.property, $rdf.namedNode(`urn:shape:${nanoid()}`), property => {
        property.addOut(sh.path, predicate)

        if (isResource(object)) {
          const childShape = this.extractShape(resource.node(object), dataset, visited)

          if (childShape.out().terms.length) {
            property.addOut(sh.node, childShape)
          }
        }
      })
    }

    return shape
  }
}

export function store(client = parsingClient): SharedDimensionsStore {
  return new Store(client, $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH))
}
