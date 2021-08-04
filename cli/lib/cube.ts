import $rdf from 'rdf-ext'
import { DatasetCore, Quad, Term } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { obj } from 'through2'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { Dataset } from '@cube-creator/model'
import StreamClient from 'sparql-http-client/StreamClient'
import { loadDataset } from './metadata'
import { publishTracer } from './otel'

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

export function expirePreviousVersions(this: Pick<Context, 'variables' | 'logger'>) {
  const timestamp = this.variables.get('timestamp')
  const baseCube = $rdf.namedNode(this.variables.get('namespace'))
  const client = new StreamClient({
    endpointUrl: this.variables.get('publish-graph-query-endpoint'),
    user: this.variables.get('publish-graph-store-user'),
    password: this.variables.get('publish-graph-store-password'),
  })

  return CONSTRUCT`
    ?cube ${schema.validThrough} ${timestamp}
  `.WHERE`
    ${baseCube} ${schema.hasPart} ?cube .

    OPTIONAL { ?cube ${schema.validThrough} ?validThrough }

    filter (
      !bound(?validThrough)
    )
  `.FROM($rdf.namedNode(this.variables.get('target-graph')))
    .execute(client.query)
}

export async function injectRevision(this: Pick<Context, 'variables' | 'logger'>, jobUri?: string) {
  let cubeNamespace = this.variables.get('namespace')
  const revision = this.variables.get('revision')
  const versionedDimensions = this.variables.get('versionedDimensions')

  const attributes = {
    cubeNamespace,
    revision,
    jobUri,
  }

  const dataset = await publishTracer.startActiveSpan('injectRevision#setup', { attributes }, async span => {
    try {
      let dataset: Dataset | undefined
      if (jobUri) {
        ({ dataset } = await loadDataset(jobUri, this.variables.get('apiClient')))
      }

      this.logger.info(`Cube revision ${revision}`)

      if (cubeNamespace.endsWith('/')) {
        cubeNamespace = cubeNamespace.slice(0, -1)
      }

      return dataset
    } finally {
      span.end()
    }
  })

  function rebase<T extends Term>(term: T, rev = revision): T {
    if (term.termType === 'NamedNode' && term.value.startsWith(cubeNamespace)) {
      return $rdf.namedNode(term.value.replace(new RegExp(`^${cubeNamespace}/?`), `${cubeNamespace}/${rev}/`)) as any
    }

    return term
  }

  function isObservationDimension(predicate: Term) {
    if (!dataset) {
      return false
    }

    return dataset.pointer.any().has(schema.about, predicate).terms.length > 0
  }

  return obj(function ({ subject, predicate, object, graph }: Quad, _, callback) {
    const rebasedSub = rebase(subject)

    // do not inject revision into dimension URI used in Constraint Shape
    if (predicate.equals(sh.path)) {
      this.push($rdf.quad(rebasedSub, predicate, object, graph))
    } else {
      const rebasedObject = rebase(object)

      this.push($rdf.quad(rebasedSub, predicate, rebasedObject, graph))

      if (rebasedObject.termType === 'NamedNode' && !rebasedObject.equals(object) && isObservationDimension(predicate)) {
        // see https://github.com/zazuko/cube-creator/issues/658
        this.push($rdf.quad(rebasedObject, schema.sameAs, object, graph))

        // see https://github.com/visualize-admin/visualization-tool/pull/75
        versionedDimensions.add(predicate)
      }
    }

    callback()
  })
}
