import { describe, it } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import { dcterms, rdf } from '@tpluscode/rdf-ns-builders'
import env from '@cube-creator/core/env'
import { cc } from '@cube-creator/core/namespace'
import * as trigger from '../../lib/pipeline/trigger.js'

describe('pipeline/trigger', () => {
  const transformJob = $rdf.clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('transformjob') })
    .addOut(rdf.type, cc.TransformJob)
  const publishJob = $rdf.clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('publishjob') })
    .addOut(rdf.type, cc.PublishJob)

  describe('github', () => {
    it('sends authenticated transform POST to github', () => {
      // given

      const params = $rdf.clownface()
        .blankNode()
        .addOut(dcterms.identifier, 'token')
      const fetch: any = sinon.spy()

      // when
      trigger.github(transformJob, params, fetch)

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

    it('sends authenticated publish POST to github', () => {
      // given

      const params = $rdf.clownface()
        .blankNode()
        .addOut(dcterms.identifier, 'token')
      const fetch: any = sinon.spy()

      // when
      trigger.github(publishJob, params, fetch)

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
    it('sends authenticated transform POST to gitlab', () => {
      // given
      const params = $rdf.clownface().blankNode()
      const fetch: any = sinon.spy()
      env.PIPELINE_TOKEN = 'token'
      env.PIPELINE_ENV = 'UNITTEST'

      // when
      trigger.gitlab(transformJob, params, fetch)

      // then
      expect(fetch).to.have.been.calledOnceWithExactly(
        env.PIPELINE_URI,
        sinon.match({
          body: new URLSearchParams({
            token: 'token',
            ref: 'master',
            'variables[ENV]': 'UNITTEST',
            'variables[TRANSFORM_JOB]': 'transformjob',
          }),
          method: 'POST',
        }),
      )
    })

    it('sends authenticated publish POST to gitlab', () => {
      // given
      const params = $rdf.clownface().blankNode()
      const fetch: any = sinon.spy()
      env.PIPELINE_TOKEN = 'token'
      env.PIPELINE_ENV = 'UNITTEST'

      // when
      trigger.gitlab(publishJob, params, fetch)

      // then
      expect(fetch).to.have.been.calledOnceWithExactly(
        env.PIPELINE_URI,
        sinon.match({
          body: new URLSearchParams({
            token: 'token',
            ref: 'master',
            'variables[ENV]': 'UNITTEST',
            'variables[PUBLISH_JOB]': 'publishjob',
          }),
          method: 'POST',
        }),
      )
    })
  })
})
