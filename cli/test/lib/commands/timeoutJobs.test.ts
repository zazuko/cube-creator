import { describe, beforeEach, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { timeoutJobs } from '../../../lib/commands'
import { setupEnv } from '../../support/env'

describe('@cube-creator/cli/lib/commands/timeoutJobs', () => {
  beforeEach(() => {
    setupEnv()
    return insertTestProject()
  })

  it('sets failed status to active jobs which were not updated since given duration', async () => {
    // given
    const updateJob = sinon.spy()

    // when
    await timeoutJobs({
      duration: 'PT6H',
      now() {
        return Date.parse('2020-10-29T20:01:54')
      },
      updateJob,
    })

    // then
    expect(updateJob).to.have.been.calledOnce
    expect(updateJob).to.have.been.calledWithMatch({
      jobUri: 'https://cube-creator.lndo.site/cube-project/ubd/csv-mapping/jobs/hung-job',
      status: schema.FailedActionStatus,
    })
  })
})
