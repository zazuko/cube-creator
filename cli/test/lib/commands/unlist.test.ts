import type { NamedNode } from '@rdfjs/types'
import env from '@cube-creator/core/env/node'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { cc } from '@cube-creator/core/namespace'
import type { AnyPointer } from 'clownface'
import namespace from '@rdfjs/namespace'
import runner from '../../../lib/commands/unlist.js'
import { setupEnv } from '../../support/env.js'

describe('@cube-creator/cli/lib/commands/unlist', function () {
  this.timeout(200000)

  const ns = {
    baseCube: namespace('https://environment.ld.admin.ch/foen/ubd/28/'),
  }

  const executionUrl = 'http://example.com/unlisting-test'

  async function resetData() {
    setupEnv()
    await insertTestProject()
  }

  let cubePointer: AnyPointer
  const job = $rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-unlist-job`)
  async function runJob() {
    // when
    await runner({
      debug: true,
      job: job.value,
      executionUrl,
    })
    await new Promise((resolve) =>
      setTimeout(resolve, 100),
    )

    // then
    const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')
    const [{ expectedGraph }] = await SELECT`?expectedGraph`
      .WHERE`
          graph ${project} {
            ${project} ${schema.maintainer} ?org .
          }

          graph ?org {
            ?org ${cc.publishGraph} ?expectedGraph .
          }
        `
      .execute(ccClients.parsingClient)

    const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
      .FROM(expectedGraph as NamedNode)
      .WHERE`?s ?p ?o`
      .execute(ccClients.streamClient))

    cubePointer = $rdf.clownface({ dataset })
  }

  before(resetData)
  before(runJob)

  it('"deprecates" previous cubes', async function () {
    expect(cubePointer.namedNode(ns.baseCube('1'))).to.matchShape({
      property: [{
        path: schema.expires,
        datatype: xsd.dateTime,
        minCount: 1,
        maxCount: 1,
      }],
    })
    expect(cubePointer.namedNode(ns.baseCube('2'))).to.matchShape({
      property: [{
        path: schema.expires,
        datatype: xsd.dateTime,
        minCount: 1,
        maxCount: 1,
      }],
    })
  })
})
