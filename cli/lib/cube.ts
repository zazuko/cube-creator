import rdf from 'rdf-ext'
import { DatasetCore, Quad, Term } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import type { Context } from 'barnard59-core/lib/Pipeline'
import map from 'barnard59-base/lib/map'

export const getObservationSetId = ({ dataset }: { dataset: DatasetCore }) => {
  const cubeId = [...dataset.match(null, cc.cube)][0].object.value

  if (cubeId.endsWith('/') || cubeId.endsWith('#')) {
    return rdf.namedNode(`${cubeId}observation/`)
  }

  return rdf.namedNode(`${cubeId}/observation/`)
}

export function getCubeId({ ptr }: { ptr: GraphPointer }) {
  return ptr.out(cc.cube).term || ''
}

export function injectRevision(this: Pick<Context, 'variables'>) {
  let cubeNamespace: string = this.variables.get('namespace')
  const revision = this.variables.get('revision')

  if (cubeNamespace.endsWith('/')) {
    cubeNamespace = cubeNamespace.slice(0, -1)
  }

  function rebase<T extends Term>(term: T): T {
    if (term.termType === 'NamedNode' && term.value.startsWith(cubeNamespace)) {
      return rdf.namedNode(term.value.replace(new RegExp(`^${cubeNamespace}/?`), `${cubeNamespace}/${revision}/`)) as any
    }

    return term
  }

  return map(({ subject, predicate, object, graph }: Quad) => {
    return rdf.quad(
      rebase(subject),
      predicate,
      rebase(object),
      graph)
  })
}
