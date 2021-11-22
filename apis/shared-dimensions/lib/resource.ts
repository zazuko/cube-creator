import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'
import { sh } from '@tpluscode/rdf-ns-builders'
import { BlankNode, NamedNode, Term } from 'rdf-js'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { nanoid } from 'nanoid'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'

export function resourceQueryPatterns(resourceOrPattern: NamedNode | SparqlTemplateResult, strict: boolean) {
  let rootPropPatterns = sparql`?term ?rootProp ?rootObject .`
  if (!strict) {
    rootPropPatterns = sparql`OPTIONAL { ${rootPropPatterns} }`
  }

  const termPattern = 'termType' in resourceOrPattern
    ? sparql`BIND( ${resourceOrPattern} as ?term )`
    : resourceOrPattern

  return sparql`
    ${termPattern}

    ?rootShape ${sh.targetNode} ?term .
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
