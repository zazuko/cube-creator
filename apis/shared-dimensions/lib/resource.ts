import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'
import { sh } from '@tpluscode/rdf-ns-builders'
import { BlankNode, NamedNode, Term } from 'rdf-js'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { nanoid } from 'nanoid'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { CONSTRUCT, DELETE, SELECT, WITH } from '@tpluscode/sparql-builder'
import ParsingClient from 'sparql-http-client/ParsingClient'

export function resourceShapePatterns(resourceOrPattern: NamedNode | SparqlTemplateResult, all = false) {
  const termPattern = 'termType' in resourceOrPattern
    ? sparql`BIND( ${resourceOrPattern} as ?term )`
    : resourceOrPattern

  let selectRoot = SELECT`?rootShape`
    .WHERE`
      ${termPattern}
      ?rootShape ${sh.targetNode} ?term .
      MINUS {
        # Exclude shapes which are children of property shapes
        ?propertyShape ${sh.node} ?rootShape .
      }
    `

  if (!all) {
    selectRoot = selectRoot.LIMIT(1)
  }

  return sparql`
    {
      ${selectRoot}
    }

    ?rootShape (!${sh.targetNode})* ?s .
    ?s ?p ?o .
  `
}

function variableSequence() {
  let N = 1
  return () => {
    return $rdf.variable(`value${N++}`)
  }
}

export function getPatternsFromShape(shapes: AnyPointer, nextVariable = variableSequence()): SparqlTemplateResult[] {
  return shapes.toArray().flatMap(shape => {
    const node = shape.out(sh.targetNode).term
    if (!node) {
      return []
    }

    const property = shape.out(sh.property)
    const childShapes = property.out(sh.node).toArray()

    const ownPatterns = property.out(sh.path).map(path => {
      return sparql`${node} ${path.term} ${nextVariable()} .`
    })
    const childPatterns = childShapes.flatMap(child => getPatternsFromShape(child, nextVariable))

    return [
      ...ownPatterns,
      ...childPatterns,
    ]
  })
}

async function getShape(id: NamedNode, graph: NamedNode, client: ParsingClient) {
  const dataset = $rdf.dataset(await CONSTRUCT`?s ?p ?o`
    .FROM(graph)
    .WHERE`${resourceShapePatterns(id)}`
    .execute(client.query))
  return clownface({ dataset }).has(sh.targetNode, id)
}

export async function deleteQuery(id: NamedNode, graph: NamedNode, client: ParsingClient) {
  const shape = await getShape(id, graph, client)
  const patterns = getPatternsFromShape(shape)

  return WITH(graph, DELETE`${patterns}`.WHERE`${patterns}`)
}

export async function resourceQuery(id: NamedNode, graph: NamedNode, client: ParsingClient) {
  const shape = await getShape(id, graph, client)

  const patterns = getPatternsFromShape(shape)

  return CONSTRUCT`${patterns}`
    .FROM(graph)
    .WHERE`${patterns}`
}

export function deleteShapesQuery(id: NamedNode, graph: NamedNode) {
  return WITH(graph, DELETE`?s ?p ?o`.WHERE`${resourceShapePatterns(id, true)}`)
}

function isResource(arg: Term): arg is NamedNode | BlankNode {
  return arg.termType === 'BlankNode' || arg.termType === 'NamedNode'
}

export function extractShape(
  resource: GraphPointer,
  ptr: AnyPointer = clownface({ dataset: $rdf.dataset() }),
  visited = new TermSet(),
): GraphPointer {
  const shape = ptr.namedNode(`urn:shape:${nanoid()}`)
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
        const childShape = extractShape(resource.node(object), ptr, visited)

        if (childShape.out().terms.length) {
          property.addOut(sh.node, childShape)
        }
      }
    })
  }

  shape.addOut(sh.targetNode, resource)
  return shape
}
