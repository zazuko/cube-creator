import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import transform from '../../../lib/commands/transform'
import { log } from '../../support/logger'
import { setupEnv } from '../../support/env'
import { client, insertTestData } from '@cube-creator/testing/lib'

describe('lib/commands/transform', function () {
  this.timeout(200000)

  before(async () => {
    setupEnv()
    await insertTestData('fuseki/sample-ubd.trig')
  })

  it('produces triples', async function () {
    // given
    const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), log.debug)

    // when
    await runner({
      to: 'graph-store',
      debug: true,
      job: `${env.API_CORE_BASE}project/ubd/csv-mapping/jobs/test-job`,
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
})
