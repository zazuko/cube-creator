import { describe, it } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { dcterms } from '@tpluscode/rdf-ns-builders'
import * as trigger from '../../lib/pipeline/trigger'
import env from '@cube-creator/core/env'

describe('pipeline/trigger', () => {
  describe('github', () => {
    it('sends authenticated POST to github', () => {
      // given
      const job = $rdf.namedNode('job')
      const params = clownface({ dataset: $rdf.dataset() })
        .blankNode()
        .addOut(dcterms.identifier, 'token')
      const fetch: any = sinon.spy()

      // when
      trigger.github(job, params, fetch)

      // then
      expect(fetch).to.have.been.calledOnceWithExactly(
        env.PIPELINE_URI,
        sinon.match({
          method: 'POST',
          headers: {
            authorization: 'Bearer token',
          },
        }),
      )
    })
  })

  describe('gitlab', () => {
    it('sends authenticated POST to gitlab', () => {
      // given
      const job = $rdf.namedNode('job')
      const params = clownface({ dataset: $rdf.dataset() }).blankNode()
      const fetch: any = sinon.spy()
      env.PIPELINE_TOKEN = 'token'
      env.PIPELINE_BRANCH = 'master'
      env.PIPELINE_ENV = 'UNITTEST'

      // when
      trigger.gitlab(job, params, fetch)

      // then
      expect(fetch).to.have.been.calledOnceWithExactly(
        env.PIPELINE_URI,
        sinon.match({
          body: new URLSearchParams({
            token: 'token',
            ref: 'master',
            'variables[JOB]': 'job',
            'variables[ENV]': 'UNITTEST',
          }),
          method: 'POST',
        }),
      )
    })
  })
})
