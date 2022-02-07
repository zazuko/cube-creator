import $rdf from 'rdf-ext'
import { DatasetCore, Quad, Term } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import clownface, { GraphPointer } from 'clownface'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { obj } from 'through2'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import { schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { Dataset, PublishJob } from '@cube-creator/model'
import StreamClient from 'sparql-http-client/StreamClient'
import { Draft } from '@cube-creator/model/Cube'
import TermSet from '@rdfjs/term-set'
import { toRdf } from 'rdf-literal'
import { loadDataset } from './metadata'
import { tracer } from './otel/tracer'

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

  let onlyDraftCubes = sparql``
  const publishJob: PublishJob | undefined = this.variables.get('publish-job')
  if (publishJob && Draft.equals(publishJob.status)) {
    onlyDraftCubes = sparql`
      ?cube ${schema.creativeWorkStatus} ?status .

      filter (
        ?status = ${Draft}
      )
    `
  }

  return CONSTRUCT`
    ?cube ${schema.expires} ${timestamp} .
  `.WHERE`
    ${baseCube} ${schema.hasPart} ?cube .

    ${onlyDraftCubes}

    OPTIONAL { ?cube ${schema.expires} ?expires }

    filter (
      !bound(?expires)
    )
  `.FROM($rdf.namedNode(this.variables.get('target-graph')))
    .execute(client.query)
}

export async function injectRevision(this: Pick<Context, 'variables' | 'logger'>, jobUri?: string) {
  let cubeNamespace = this.variables.get('namespace')
  const revision = this.variables.get('revision')
  const metadata = this.variables.get('metadata')
  const versionedDimensions = new TermSet()

  const attributes = {
    cubeNamespace,
    revision,
    jobUri,
  }

  const dataset = await tracer.startActiveSpan('injectRevision#setup', { attributes }, async span => {
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
      return $rdf.namedNode(term.value.replace(new RegExp(`^${cubeNamespace}(/?.*)$`), `${cubeNamespace}/${rev}$1`)) as any
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
    const rebasedObject = rebase(object)

    this.push($rdf.quad(rebasedSub, predicate, rebasedObject, graph))

    if (rebasedObject.termType === 'NamedNode' && !rebasedObject.equals(object) && isObservationDimension(predicate)) {
      // see https://github.com/zazuko/cube-creator/issues/658
      this.push($rdf.quad(rebasedObject, schema.sameAs, object, graph))

      // see https://github.com/visualize-admin/visualization-tool/pull/75
      versionedDimensions.add(predicate)
    }

    return callback()
  }, function (done) {
    const metadataPointer = clownface({
      dataset: metadata,
    })

    metadataPointer
      .node([...versionedDimensions])
      .in(sh.path)
      .forEach(propShape => {
        this.push($rdf.quad(propShape.term, schema.version, toRdf(revision)))
      })

    done()
  })
}
