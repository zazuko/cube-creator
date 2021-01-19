import $rdf from 'rdf-ext'
import { DatasetCore, Quad, Term, Quad_Subject as QuadSubject } from 'rdf-js'
import { cc, cube } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import type { Context } from 'barnard59-core/lib/Pipeline'
import map from 'barnard59-base/lib/map'
import TermMap from '@rdfjs/term-map'
import { rdf } from '@tpluscode/rdf-ns-builders'

export const getObservationSetId = ({ dataset }: { dataset: DatasetCore }) => {
  const cubeId = [...dataset.match(null, cc.cube)][0].object.value

  if (cubeId.endsWith('/') || cubeId.endsWith('#')) {
    return $rdf.namedNode(`${cubeId}observation/`)
  }

  return $rdf.namedNode(`${cubeId}/observation/`)
}

export function getCubeId({ ptr }: { ptr: GraphPointer }) {
  return ptr.out(cc.cube).term || ''
}

export function injectRevision(this: Pick<Context, 'variables' | 'log'>) {
  let cubeNamespace = this.variables.get('namespace')
  const revision = this.variables.get('revision')
  const previousCubes = new TermMap<Term, QuadSubject>()
  this.variables.set('previousCubes', previousCubes)
  const mappedTerms = new TermMap<Term, Term>()
  this.variables.set('mappedCubeTerms', mappedTerms)

  this.log.info(`Cube revision ${revision}`)

  if (cubeNamespace.endsWith('/')) {
    cubeNamespace = cubeNamespace.slice(0, -1)
  }

  function rebase<T extends Term>(term: T, rev = revision): T {
    if (term.termType === 'NamedNode' && term.value.startsWith(cubeNamespace)) {
      const newTerm = $rdf.namedNode(term.value.replace(new RegExp(`^${cubeNamespace}/?`), `${cubeNamespace}/${rev}/`)) as any
      mappedTerms.set(newTerm, term)
      return newTerm
    }

    return term
  }

  return map(({ subject, predicate, object, graph }: Quad) => {
    const rebasedSub = rebase(subject)

    if (revision > 1 && predicate.equals(rdf.type) && object.equals(cube.Cube)) {
      previousCubes.set(rebasedSub, rebase(subject, revision - 1))
    }

    return $rdf.quad(
      rebasedSub,
      predicate,
      rebase(object),
      graph)
  })
}
