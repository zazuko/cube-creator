import { BlankNode, NamedNode, Quad, Term } from 'rdf-js'
import through2 from 'through2'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import BlankNodeExt from 'rdf-ext/lib/BlankNode'
import NamedNodeExt from 'rdf-ext/lib/NamedNode'
import QuadExt from 'rdf-ext/lib/Quad'
import { nanoid } from 'nanoid'
import env from './env'

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
  return clownface({
    dataset: $rdf.dataset([...pointer.dataset].map(rewriteQuad)),
  }).node(rewriteTerm<T>(pointer.term as any))
}

export function removeBnodes(pointer: GraphPointer<NamedNode>): GraphPointer<NamedNode> {
  const map = new TermMap<BlankNodeExt, NamedNodeExt>()
  function replaceBlank(quad: QuadExt) {
    if (quad.subject.termType !== 'BlankNode' && quad.object.termType !== 'BlankNode') {
      return quad
    }

    let { subject, object } = quad
    if (quad.subject.termType === 'BlankNode') {
      subject = map.get(quad.subject) || $rdf.namedNode(`urn:shape:${nanoid()}`)
      map.set(quad.subject, subject)
    }
    if (quad.object.termType === 'BlankNode') {
      object = map.get(quad.object) || $rdf.namedNode(`urn:shape:${nanoid()}`)
      map.set(quad.object, object)
    }

    return $rdf.quad(subject, quad.predicate, object, quad.graph)
  }

  const dataset = $rdf.dataset([...pointer.dataset]).map(replaceBlank)
  return clownface({ dataset }).namedNode(pointer.term)
}

export function restoreBnodes() {
  const map = new TermMap<Term, BlankNode>()

  function namedToBlank<T extends Term>(term: T): T | BlankNode {
    if (term.termType === 'NamedNode' && /^urn:/.test(term.value)) {
      const blank = map.get(term) || $rdf.blankNode()
      map.set(term, blank)
      return blank
    }

    return term
  }

  return through2.obj(function (quad: Quad, _, next) {
    const { subject, predicate, object, graph } = quad

    const restoredQuad = $rdf.quad(
      namedToBlank(subject),
      predicate,
      namedToBlank(object),
      namedToBlank(graph),
    )

    this.push(restoredQuad)
    return next()
  })
}
