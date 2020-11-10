import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { StreamClient } from 'sparql-http-client/StreamClient'
import StreamQuery from 'sparql-http-client/StreamQuery'
import StreamStore from 'sparql-http-client/StreamStore'
import ResourceStore from '../lib/ResourceStore'
import { ex } from './support/namespace'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { manages } from '../lib/resources/hydraManages'

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

    it('adds hydra:Resource type by default', () => {
      // given
      const store = new ResourceStore(client)

      // when
      const foo = store.create(ex.Foo)

      // then
      expect(foo.out(rdf.type).term).to.deep.eq(hydra.Resource)
    })

    it('does not add hydra:Resource type when flag is false', () => {
      // given
      const store = new ResourceStore(client)

      // when
      const foo = store.create(ex.Foo, {
        implicitlyDereferencable: false,
      })

      // then
      expect(foo.out(rdf.type).terms).to.have.length(0)
    })
  })

  describe('createMember', () => {
    it('asserts triples using hydra:manages patterns', async () => {
      // given
      const store = new ResourceStore(client)
      store.create($rdf.namedNode('people'))
        .addOut(...manages({
          property: rdf.type,
          object: schema.Person,
        }))
        .addOut(...manages({
          property: schema.employee,
          subject: ex.Company,
        }))

      // when
      const person = await store.createMember($rdf.namedNode('people'), ex.Foo)

      // then
      expect(person.out(rdf.type).terms).to.deep.contain(schema.Person)
      expect(person.in(schema.employee).term).to.deep.equal(ex.Company)
    })

    it('does not assert anything when hydra:manages are malformed', async () => {
      // given
      const store = new ResourceStore(client)
      store.create($rdf.namedNode('people'))
        .addOut(hydra.manages, manages => {
          manages.addOut(hydra.property, rdf.type)
        })
        .addOut(hydra.manages, manages => {
          manages
            .addOut(hydra.subject, ex.Company)
            .addOut(hydra.property, schema.employee)
            .addOut(hydra.object, ex.Bogus)
        })

      // when
      const person = await store.createMember($rdf.namedNode('people'), ex.Foo, {
        implicitlyDereferencable: false,
      })

      // then
      expect(person.out().terms).to.have.length(0)
      expect(person.in().terms).to.have.length(0)
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
      expect(client.query.update).to.have.been.calledOnce
      expect(query.update.firstCall.args[0]).to.matchSnapshot(this)
    })
  })

  describe('delete', () => {
    it('delete is adding DROP GRAPH statement and removes from inserts', async function () {
      // given
      const resourceStore = new ResourceStore(client)
      resourceStore.create(ex.Foo)
      resourceStore.delete(ex.Foo)

      // when
      await resourceStore.save()

      // then
      expect(query.update.firstCall.args[0]).to.matchSnapshot(this)
    })
  })
})
