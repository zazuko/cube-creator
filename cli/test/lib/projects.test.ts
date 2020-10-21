import { describe, before, beforeEach, it } from 'mocha'
import { expect } from 'chai'
import { Hydra } from 'alcaeus/node'
import env from '@cube-creator/core/env'
import { ProjectIterator } from '../../lib/project'
import { insertTestData } from '../support/testData'
import { setupEnv, logger } from '../support/env'
import { Table } from '@rdfine/csvw'

Hydra.baseUri = env.API_CORE_BASE

describe('lib/projects', function () {
  this.timeout(20000)

  let variables: Map<string, string>
  const log = {
    debug: logger.extend('debug'),
    info: logger.extend('info'),
    warn: logger.extend('warn'),
    error: logger.extend('error'),
  }

  before(async () => {
    setupEnv()
    await insertTestData()
  })

  beforeEach(() => {
    variables = new Map()
  })

  describe('ProjectIterator', () => {
    it('streams csv table objects from project', async () => {
      // given
      const iteratorStream = new ProjectIterator({ projectUri: '/project/cli-test', log, variables })

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

    it('sets cube URI as pipeline variable "graph"', async () => {
      // given
      const iteratorStream = new ProjectIterator({ projectUri: '/project/cli-test', log, variables })

      // when
      await new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        iteratorStream.on('data', () => {})
        iteratorStream.on('end', resolve)
        iteratorStream.on('error', reject)
      })

      // then
      expect(variables.get('graph')).to.eq(`${env.API_CORE_BASE}cube/cli-test`)
    })
  })
})
