import { describe, before, beforeEach, it } from 'mocha'
import { expect } from 'chai'
import { Hydra } from 'alcaeus/node'
import env from '@cube-creator/core/env'
import { JobIterator } from '../../lib/job'
import { insertTestData } from '@cube-creator/testing/lib'
import { setupEnv } from '../support/env'
import { Table } from '@rdfine/csvw'
import { log } from '../support/logger'

Hydra.baseUri = env.API_CORE_BASE

describe('lib/job', function () {
  this.timeout(20000)

  let variables: Map<string, string>

  before(async () => {
    setupEnv()
    await insertTestData('fuseki/sample-ubd.trig')
  })

  beforeEach(() => {
    variables = new Map()
  })

  describe('JobIterator', () => {
    it('streams csv table objects from job', async () => {
      // given
      const iteratorStream = new JobIterator({ jobUri: `${env.API_CORE_BASE}project/ubd/csv-mapping/jobs/test-job`, log, variables })

      // when
      const results: Table[] = []
      for await (const table of iteratorStream) {
        results.push(table)
      }

      // then
      expect(results).to.have.length(2)
      expect(results[0].id.value).to.match(new RegExp('/project/ubd/csv-mapping/table-\\w+/csvw$'))
      expect(results[0].dialect?.quoteChar).to.equal('"')
      expect(results[0].dialect?.delimiter).to.equal(',')
      expect(results[0].dialect?.header).to.equal(true)
    })

    it('sets cube URI as pipeline variable "graph"', async () => {
      // given
      const iteratorStream = new JobIterator({ jobUri: `${env.API_CORE_BASE}project/ubd/csv-mapping/jobs/test-job`, log, variables })

      // when
      await new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        iteratorStream.on('data', () => {})
        iteratorStream.on('end', resolve)
        iteratorStream.on('error', reject)
      })

      // then
      expect(variables.get('graph')).to.eq(`${env.API_CORE_BASE}cube-project/ubd/cube-data`)
    })
  })
})
