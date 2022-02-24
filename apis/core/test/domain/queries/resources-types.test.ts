import { describe, it, beforeEach } from 'mocha'
import env from '@cube-creator/core/env'
import $rdf from 'rdf-ext'
import ParsingClient from 'sparql-http-client/ParsingClient'
import sinon from 'sinon'
import { expect } from 'chai'
import { loadResourcesTypes } from '../../../lib/domain/queries/resources-types'

describe('@cube-creator/core-api/lib/domain/queries/resources-types', () => {
  let sparql: ParsingClient.ParsingClient

  beforeEach(() => {
    sparql = {
      query: {
        construct: sinon.stub().resolves([]),
      } as any,
      store: {} as never,
    }
  })

  it('fetches "own" resource from sparql endpoint', async () => {
    // given
    const ids = [
      $rdf.namedNode(`${env.API_CORE_BASE}/foo`),
      $rdf.namedNode(`${env.API_CORE_BASE}/bar`),
      $rdf.namedNode(`${env.API_CORE_BASE}/baz`),
    ]

    // when
    await loadResourcesTypes(ids, {
      sparql,
    })

    // then
    expect(sparql.query.construct).to.have.been.calledWith(sinon.match(new RegExp(`${env.API_CORE_BASE}/(foo|bar|baz)`, 'g')))
  })

  it('fetches external resources from external sparql service', async () => {
    // given
    const ids = [
      $rdf.namedNode('http://example.com/foo'),
      $rdf.namedNode('http://example.com/bar'),
      $rdf.namedNode('http://example.com/baz'),
    ]

    // when
    await loadResourcesTypes(ids, {
      sparql,
    })

    // then
    expect(sparql.query.construct).to.have.been.calledWith(sinon.match(/service <.+>/i))
  })
})
