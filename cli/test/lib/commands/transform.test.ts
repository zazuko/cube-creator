import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import debug from 'debug'
import { Hydra } from 'alcaeus/node'
import { rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import transform from '../../../lib/commands/transform'
import { setupEnv } from '../../support/env'
import { client, insertTestData } from '@cube-creator/testing/lib'

describe('lib/commands/transform', function () {
  this.timeout(200000)

  const executionUrl = 'http://example.com/transformation-test'

  before(async () => {
    setupEnv()
    await insertTestData('fuseki/sample-ubd.trig')
  })

  it('produces triples', async function () {
    // given
    const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

    // when
    await runner({
      to: 'graph-store',
      debug: true,
      job: `${env.API_CORE_BASE}project/ubd/csv-mapping/jobs/test-job`,
      executionUrl,
    })
    await new Promise((resolve) =>
      setTimeout(resolve, 100),
    )

    // then
    const expectedGraph = $rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`)
    const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
      .FROM(expectedGraph)
      .WHERE`?s ?p ?o`
      .execute(client.query))

    expect(dataset.toCanonical()).to.matchSnapshot(this)
  })

  it('updates job when pipeline ends successfully', async function () {
    // given
    const jobUri = `${env.API_CORE_BASE}project/ubd/csv-mapping/jobs/test-job`
    const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

    // when
    await runner({
      to: 'graph-store',
      debug: true,
      job: jobUri,
      executionUrl,
    })

    // then
    const job = await Hydra.loadResource(jobUri)
    expect(job.representation?.root).to.matchShape({
      property: [{
        path: schema.actionStatus,
        hasValue: schema.CompletedActionStatus,
        minCount: 1,
        maxCount: 1,
      }, {
        path: rdfs.seeAlso,
        minCount: 1,
        nodeKind: sh.IRI,
      }],
    })
  })

  it('updates job when pipeline has errors', async function () {
    // given
    const jobUri = `${env.API_CORE_BASE}project/ubd/csv-mapping/jobs/broken-job`
    const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

    // when
    await runner({
      to: 'graph-store',
      debug: true,
      job: jobUri,
      executionUrl,
    })
    await new Promise((resolve) =>
      setTimeout(resolve, 100),
    )

    // then
    const job = await Hydra.loadResource(jobUri)
    expect(job.representation?.root).to.matchShape({
      property: [{
        path: schema.actionStatus,
        hasValue: schema.FailedActionStatus,
        minCount: 1,
        maxCount: 1,
      }, {
        path: rdfs.seeAlso,
        minCount: 1,
        nodeKind: sh.IRI,
      }, {
        path: schema.error,
        node: {
          property: {
            path: schema.description,
            datatype: xsd.string,
            minCount: 1,
          },
        },
        minCount: 1,
      }],
    })
  })
})
