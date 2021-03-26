/* eslint-disable camelcase */
import { DatasetCore, NamedNode, Quad, Quad_Graph, Quad_Predicate, Term } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'

function quadsAbout (dataset: DatasetCore, graph: Quad_Graph | undefined, excludeProps: Quad_Predicate[] = []) {
  const subjects = new TermSet()
  const excludedProps = new TermSet(excludeProps)

  return function * nextSubject (subject: Term): Generator<Quad> {
    if (!subjects.has(subject) && subject.termType !== 'Literal') {
      subjects.add(subject)
      for (const quad of dataset.match(subject, null, null, graph)) {
        if (excludedProps.has(quad.predicate)) {
          continue
        }

        yield quad
        for (const objectQuad of nextSubject(quad.object)) {
          yield objectQuad
        }
      }
    }
  }
}

/**
 * Returns a Concise Bounded Description of a given resource, taking quads from the original graph
 * and optionally excluding any subgraphs connected with the provided predicate
 */
export function conciseBoundedDescription (pointer: GraphPointer, exclude: NamedNode[] = []): GraphPointer {
  const graph = pointer._context[0].graph
  const dataset = $rdf.dataset().addAll([...quadsAbout(pointer.dataset, graph, exclude)(pointer.term)])

  return clownface({ dataset, term: pointer.term, graph })
}
