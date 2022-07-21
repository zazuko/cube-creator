import { describe, beforeEach, it } from 'mocha'
import sinon from 'sinon'
import { expect } from 'chai'
import { cc } from '@cube-creator/core/namespace'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { timeoutJobs } from '../../../lib/commands'
import { setupEnv } from '../../support/env'

describe('@cube-creator/cli/lib/commands/timeoutJobs', () => {
  beforeEach(function () {
    this.timeout(20000)
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
      status: cc.CanceledJobStatus,
    })
  })
})
