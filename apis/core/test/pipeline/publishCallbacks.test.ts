import { describe, it, beforeEach, before } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import nodeFetch, { Response } from 'node-fetch'
import { ccClients } from '@cube-creator/testing/lib'
import { blankNode } from '@cube-creator/testing/clownface'
import { cc } from '@cube-creator/core/namespace'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { callbacks } from '../../lib/pipeline/publishCallbacks.js'

describe('@cube-creator/core/lib/pipeline/publishCallback @SPARQL', () => {
  const { gitlab } = callbacks
  let fetch: typeof nodeFetch

  beforeEach(() => {
    fetch = sinon.stub().resolves() as any
  })

  before(async () => {
    process.env.GITLAB_API_URL = 'https://gitlab.zazuko.com'
    process.env.GITLAB_TOKEN = 'GITLAB_TOKEN'

    await insertTestProject()
  })

  describe('gitlab', () => {
    describe('onSuccess', () => {
      let res: Response

      before(() => {
        res = <Response>{
          json: async () => ({ project_id: 'test', id: '111' }),
        }
      })

      it('sets pipeline URL to job', async () => {
        // given
        const job = blankNode()
          .addOut(cc.revision, 4)
          .addOut(cc.project, $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd'))

        // when
        await gitlab.onSuccess?.({
          job,
          fetch,
          client: ccClients.parsingClient,
          res,
        })

        // then
        expect(job.out($rdf.namedNode('urn:gitlab:pipelineUrl')).term)
          .to.deep.eq($rdf.namedNode('https://gitlab.zazuko.com/projects/test/pipelines/111'))
      })

      it('does not throw when gitlab request fails', async () => {
        // given
        const job = blankNode()
          .addOut(cc.revision, 3)
          .addOut(cc.project, $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd'))
        ;(fetch as any).rejects()

        // when
        const promise = gitlab.onSuccess?.({
          job,
          fetch,
          client: ccClients.parsingClient,
          res,
        })

        // then
        await expect(promise).to.be.eventually.fulfilled
      })

      it('cancels concurrent jobs deploying same version', async () => {
        // given
        const job = blankNode()
          .addOut(cc.revision, 3)
          .addOut(cc.project, $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd'))

        // when
        await gitlab.onSuccess?.({
          job,
          fetch,
          client: ccClients.parsingClient,
          res,
        })

        // then
        expect(fetch).to.have.been.calledWith(
          'https://gitlab.zauzko.com/pipeline/test-publish-job/cancel',
          sinon.match.object,
        )
        expect(fetch).to.have.been.calledOnce
      })
    })
  })
})
