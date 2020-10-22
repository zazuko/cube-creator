import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import transform from '../../../lib/commands/transform'
import { log } from '../../support/logger'
import { setupEnv } from '../../support/env'
import { client, insertTestData } from '../../support/testData'

describe('lib/commands/transform', function () {
  this.timeout(200000)

  before(async () => {
    setupEnv()
    await insertTestData()
  })

  it('produces triples', async function () {
    // given
    const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), log.debug)
    const variable = new Map<string, string>([
      ['graph-store-endpoint', 'http://db.cube-creator.lndo.site/cube-creator/data'],
      ['graph-store-user', 'admin'],
      ['graph-store-password', 'password'],
    ])
    const authParam = new Map([
      ['client_id', process.env.AUTH_RUNNER_CLIENT_ID!],
    ])

    // when
    await runner({
      to: 'graph-store',
      debug: true,
      enableBufferMonitor: false,
      project: `${env.API_CORE_BASE}project/cli-test`,
      variable,
      authParam,
    })

    // then
    const expectedGraph = $rdf.namedNode(`${env.API_CORE_BASE}cube/cli-test`)
    const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
      .FROM(expectedGraph)
      .WHERE`?s ?p ?o`
      .execute(client.query))

    expect(dataset.toCanonical()).to.matchSnapshot(this)
  })
})
