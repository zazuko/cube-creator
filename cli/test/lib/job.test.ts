import { describe, before, beforeEach, it } from 'mocha'
import { expect } from 'chai'
import { Hydra } from 'alcaeus/node'
import env from '@cube-creator/core/env'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { JobIterator } from '../../lib/job'
import { insertTestProject } from '@cube-creator/testing/lib'
import { setupEnv } from '../support/env'
import { Table } from '@rdfine/csvw'
import { log } from '../support/logger'
import type { Variables } from 'barnard59-core/lib/Pipeline'

Hydra.baseUri = env.API_CORE_BASE

describe('lib/job', function () {
  this.timeout(20000)

  let variables: Variables

  before(async () => {
    setupEnv()
    await insertTestProject()
  })

  beforeEach(() => {
    variables = new Map<any, any>([
      ['executionUrl', 'http://foo.runner/job/bar'],
    ])
  })

  describe('JobIterator', () => {
    it('streams csv table objects from job', async () => {
      // given
      const iteratorStream = new JobIterator({ jobUri: `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`, log, variables })

      // when
      const results: Table[] = []
      for await (const table of iteratorStream) {
        results.push(table.csvwResource)
      }

      // then
      expect(results).to.have.length(2)
      expect(results[0].id.value).to.match(new RegExp('/cube-project/ubd/csv-mapping/table-\\w+/csvw$'))
      expect(results[0].dialect?.quoteChar).to.equal('"')
      expect(results[0].dialect?.delimiter).to.equal(',')
      expect(results[0].dialect?.header).to.equal(true)
    })

    it('sets cube URI as pipeline variable "graph"', async () => {
      // given
      const iteratorStream = new JobIterator({ jobUri: `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`, log, variables })

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

    it('updates execution URL and sets job status to active', async () => {
      // given
      const jobUri = `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`
      const iteratorStream = new JobIterator({ jobUri, log, variables })

      // when
      await new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        iteratorStream.on('data', () => {})
        iteratorStream.on('end', resolve)
        iteratorStream.on('error', reject)
      })

      // then
      const job = await Hydra.loadResource(jobUri)
      expect(job.representation?.root).to.matchShape({
        property: [{
          path: schema.actionStatus,
          hasValue: schema.ActiveActionStatus,
          minCount: 1,
          maxCount: 1,
        }, {
          path: rdfs.seeAlso,
          hasValue: $rdf.namedNode('http://foo.runner/job/bar'),
          minCount: 1,
          maxCount: 1,
        }],
      })
    })
  })
})
