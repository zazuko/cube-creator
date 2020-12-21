import { describe, it, beforeEach } from 'mocha'
import env from '@cube-creator/core/env'
import $rdf from 'rdf-ext'
import { loadResourcesTypes } from '../../../lib/domain/queries/resources-types'
import ParsingClient from 'sparql-http-client/ParsingClient'
import * as sinon from 'sinon'
import { expect } from 'chai'

describe('domain/queries/resources-types', () => {
  let sparql: ParsingClient.ParsingClient
  let fetch: sinon.SinonStub

  beforeEach(() => {
    fetch = sinon.stub().resolves({
      dataset: Promise.resolve([]),
    })
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
      fetch,
    })

    // then
    expect(fetch).not.to.have.been.called
    expect(sparql.query.construct).to.have.been.calledWith(sinon.match(new RegExp(`${env.API_CORE_BASE}/(foo|bar|baz)`, 'g')))
  })

  it('fetches external resources directly', async () => {
    // given
    const ids = [
      $rdf.namedNode('http://example.com/foo'),
      $rdf.namedNode('http://example.com/bar'),
      $rdf.namedNode('http://example.com/baz'),
    ]

    // when
    await loadResourcesTypes(ids, {
      sparql,
      fetch,
    })

    // then
    expect(sparql.query.construct).not.to.have.been.called
    expect(fetch).to.have.been.calledThrice
    expect(fetch).to.have.been.calledWith(sinon.match(sinon.match(new RegExp('http://example.com/(foo|bar|baz)'))))
  })

  it('returns empty if fetch fails', async () => {
    // given
    const ids = [
      $rdf.namedNode('http://example.com/foo'),
    ]
    fetch.rejects()

    // when
    const quads = await loadResourcesTypes(ids, {
      sparql,
      fetch,
    })

    // then
    expect(quads).to.have.length(0)
  })
})
