import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { StreamClient } from 'sparql-http-client/StreamClient'
import StreamQuery from 'sparql-http-client/StreamQuery'
import StreamStore from 'sparql-http-client/StreamStore'
import ResourceStore from '../lib/ResourceStore'
import { ex } from './support/namespace'

describe('ResourceStore', () => {
  let client: StreamClient
  let query: sinon.SinonStubbedInstance<StreamQuery>
  let store: sinon.SinonStubbedInstance<StreamStore>

  beforeEach(() => {
    query = sinon.createStubInstance(StreamQuery)
    store = sinon.createStubInstance(StreamStore)

    client = {
      query,
      store: store as any,
    }
  })

  describe('get', () => {
    it('loads resource from sparql endpoint', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset().toStream())

      // when
      await store.get(ex.Foo)

      // then
      expect(client.query.construct).to.have.been.calledOnce
    })

    it('called twice returns same object', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset().toStream())
      const expected = await store.get(ex.Foo)

      // when
      const actual = await store.get(ex.Foo)

      // then
      expect(actual).to.eq(expected)
    })

    it('returns object previously created', async () => {
      // given
      const store = new ResourceStore(client)
      const expected = store.create(ex.Foo)

      // when
      const actual = await store.get(ex.Foo)

      // then
      expect(actual).to.eq(expected)
      expect(client.query.construct).to.not.have.been.called
    })
  })

  describe('create', () => {
    it('throws when called twice', () => {
      // given
      const store = new ResourceStore(client)

      // when
      store.create(ex.Foo)

      // then
      expect(() => store.create(ex.Foo)).to.throw
    })
  })

  describe('save', () => {
    it('stores resources in individual named graphs', async function () {
      // given
      const resources = new ResourceStore(client)
      resources.create(ex.Foo).addOut(ex.foo, 'foo')
      resources.create(ex.Bar).addOut(ex.bar, 'bar')

      // when
      await resources.save()

      // then
      expect(client.store.put).to.have.been.calledOnce
      const savedDataset = await $rdf.dataset().import(store.put.firstCall.args[0])
      expect(savedDataset.toCanonical()).to.matchSnapshot(this)
    })
  })
})
