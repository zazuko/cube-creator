import $rdf from 'rdf-ext'
import { DatasetCore, Quad, Term, Quad_Subject as QuadSubject } from 'rdf-js'
import { cc, cube } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { obj } from 'through2'
import TermMap from '@rdfjs/term-map'
import { rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { Dataset } from '@cube-creator/model'
import { loadDataset } from './metadata'

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

export async function injectRevision(this: Pick<Context, 'variables' | 'log'>, jobUri?: string) {
  let cubeNamespace = this.variables.get('namespace')
  const revision = this.variables.get('revision')
  const previousCubes = new TermMap<Term, QuadSubject>()
  this.variables.set('previousCubes', previousCubes)
  let dataset: Dataset | undefined
  if (jobUri) {
    ({ dataset } = await loadDataset(jobUri))
  }

  this.log.info(`Cube revision ${revision}`)

  if (cubeNamespace.endsWith('/')) {
    cubeNamespace = cubeNamespace.slice(0, -1)
  }

  function rebase<T extends Term>(term: T, rev = revision): T {
    if (term.termType === 'NamedNode' && term.value.startsWith(cubeNamespace)) {
      return $rdf.namedNode(term.value.replace(new RegExp(`^${cubeNamespace}/?`), `${cubeNamespace}/${rev}/`)) as any
    }

    return term
  }

  function shouldAddSameAs(predicate: Term) {
    if (!dataset) {
      return false
    }

    return dataset.pointer.any().has(schema.about, predicate).terms.length > 0
  }

  return obj(function ({ subject, predicate, object, graph }: Quad, _, callback) {
    const rebasedSub = rebase(subject)

    if (revision > 1 && predicate.equals(rdf.type) && object.equals(cube.Cube)) {
      previousCubes.set(rebasedSub, rebase(subject, revision - 1))
    }

    // do not inject revision into dimension URI used in Constraint Shape
    if (predicate.equals(sh.path)) {
      this.push($rdf.quad(rebasedSub, predicate, object, graph))
    } else {
      const rebasedObject = rebase(object)

      this.push($rdf.quad(rebasedSub, predicate, rebasedObject, graph))

      if (rebasedObject.termType === 'NamedNode' && !rebasedObject.equals(object) && shouldAddSameAs(predicate)) {
        // see https://github.com/zazuko/cube-creator/issues/658
        this.push($rdf.quad(rebasedObject, schema.sameAs, object, graph))
      }
    }

    callback()
  })
}
