import { describe, before, beforeEach, it } from 'mocha'
import { expect } from 'chai'
import $rdf from '@cube-creator/env'
import env from '@cube-creator/core/env/node'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { Table } from '@rdfine/csvw'
import type { VariableMap } from 'barnard59-core'
import { logger } from '../support/logger.js'
import { setupEnv } from '../support/env.js'
import { TableIterator } from '../../lib/job.js'

$rdf.hydra.baseUri = env.API_CORE_BASE

describe('lib/job', function () {
  this.timeout(360 * 1000)

  let variables: VariableMap

  before(async () => {
    setupEnv()
    await insertTestProject()
  })

  beforeEach(() => {
    variables = new Map<any, any>([
      ['executionUrl', 'http://foo.runner/job/bar'],
    ])
  })

  describe('TableIterator', () => {
    it('streams csv table objects from job', async () => {
      // given
      const iteratorStream = new TableIterator({ jobUri: `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`, logger, variables })

      // when
      const results: Table[] = []
      for await (const table of iteratorStream) {
        results.push(table.csvwResource)
      }

      // then
      expect(results).to.have.length(3)
      expect(results[0].id.value).to.match(new RegExp('/cube-project/ubd/csv-mapping/table-\\w+/csvw$'))
      expect(results[0].dialect?.quoteChar).to.equal('"')
      expect(results[0].dialect?.delimiter).to.equal(',')
      expect(results[0].dialect?.header).to.equal(true)
    })

    it('sets cube URI as pipeline variable "graph"', async () => {
      // given
      const iteratorStream = new TableIterator({ jobUri: `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`, logger, variables })

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
