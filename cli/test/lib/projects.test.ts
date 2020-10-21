/* eslint-disable no-console */
import { describe, before, it } from 'mocha'
import { expect } from 'chai'
import { Hydra } from 'alcaeus/node'
import env from '@cube-creator/core/env'
import { ProjectIterator } from '../../lib/project'
import { insertTestData } from '../support/testData'
import { Table } from '@rdfine/csvw'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

Hydra.baseUri = env.API_CORE_BASE
Hydra.defaultHeaders = {
  'x-user': 'cli test',
}

describe('lib/projects', () => {
  const logger: any = {
    debug: console.log,
    info: console.log,
    warn: console.warn,
    error: console.error,
  }

  before(async () => {
    await insertTestData()
  })

  describe('ProjectIterator', () => {
    it('streams csv table objects from project', async function () {
      // given
      this.timeout(5000)
      const iteratorStream = new ProjectIterator('/project/cli-test', logger)

      // when
      const results: Table[] = []
      for await (const table of iteratorStream) {
        results.push(table)
      }

      // then
      expect(results).to.have.length(1)
      expect(results[0].id.value).to.match(new RegExp('/project/cli-test/mapping/table/foo/csvw$'))
      expect(results[0].dialect?.quoteChar).to.equal("'")
      expect(results[0].dialect?.delimiter).to.equal('--')
    })
  })
})
