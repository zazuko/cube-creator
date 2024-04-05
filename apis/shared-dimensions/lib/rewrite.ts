import type { Quad, Term } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import env from './env.js'

export function rewriteTerm<T extends Term>(term: T): T {
  if (term.termType === 'NamedNode') {
    return $rdf.namedNode(term.value.replace(env.MANAGED_DIMENSIONS_API_BASE, env.MANAGED_DIMENSIONS_BASE)) as any
  }

  return term
}

function rewriteQuad({ subject, predicate, object, graph }: Quad): Quad {
  return $rdf.quad(
    rewriteTerm(subject),
    rewriteTerm(predicate),
    rewriteTerm(object),
    rewriteTerm(graph),
  )
}

/**
 * Rewrite pointer's dataset by replacing the API_BASE with BASE as configured in the environment
 */
export function rewrite<T extends Term>(pointer: GraphPointer<T>): GraphPointer<T> {
  return $rdf.clownface({
    dataset: $rdf.dataset([...pointer.dataset].map(rewriteQuad)),
  }).node(rewriteTerm<T>(pointer.term as any))
}
