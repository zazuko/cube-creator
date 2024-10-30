import { describe, it, beforeEach, before, after } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { StreamClient } from 'sparql-http-client/StreamClient'
import StreamQuery from 'sparql-http-client/StreamQuery'
import StreamStore from 'sparql-http-client/StreamStore'
import { ex } from '@cube-creator/testing/lib/namespace'
import { as, hydra, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { ASK, DELETE, INSERT } from '@tpluscode/sparql-builder'
import { ccClients } from '@cube-creator/testing/lib'
import ResourceStore, { SparqlStoreFacade } from '../lib/ResourceStore'
import { manages } from '../lib/resources/hydraManages'
import * as Activity from '../lib/activity'

describe('ResourceStore', () => {
  let client: StreamClient
  let query: sinon.SinonStubbedInstance<StreamQuery>
  let store: sinon.SinonStubbedInstance<StreamStore>

  beforeEach(() => {
    query = sinon.createStubInstance(StreamQuery)

    client = {
      query,
      store: store as any,
    }
  })

  before(() => {
    sinon.stub(Activity, 'now')
      .returns(new Date(Date.parse('2021-10-26T08:00:00.000Z')))
    sinon.stub(Activity, 'newId')
      .returns($rdf.namedNode('https://cube-creator.lndo.site/activity/test-activity'))
  })

  after(() => {
    sinon.restore()
  })

  describe('get', () => {
    it('loads resource from sparql endpoint', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset([
        $rdf.quad(ex.Foo, rdfs.label, $rdf.literal('foo')),
      ]).toStream())

      // when
      await store.get(ex.Foo)

      // then
      expect(client.query.construct).to.have.been.calledOnce
    })

    it('called twice returns same object', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset([
        $rdf.quad(ex.Foo, rdfs.label, $rdf.literal('foo')),
      ]).toStream())
      const expected = await store.get(ex.Foo)

      // when
      const actual = await store.get(ex.Foo)

      // then
      expect(actual.term).to.eq(expected.term)
    })

    it('returns object previously created', async () => {
      // given
      const store = new ResourceStore(client)
      const expected = store.create(ex.Foo)

      // when
      const actual = await store.get(ex.Foo)

      // then
      expect(actual.term).to.eq(expected.term)
      expect(client.query.construct).to.not.have.been.called
    })

    it('returns "undefined" when it is allowed resource comes back empty', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset().toStream())

      // when
      const resource = await store.get('foo', { allowMissing: true })

      // then
      expect(resource).to.be.undefined
    })

    it('throws if resource comes back empty', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset().toStream())

      // when
      const promise = store.get('foo')

      // then
      await expect(promise).to.be.rejected
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

    it('does not update store if nothing changes', async () => {
      // given
      const store = new ResourceStore(client)
      query.construct.callsFake(async () => $rdf.dataset([
        $rdf.quad(ex.Resource, rdfs.label, $rdf.literal('foo')),
      ]).toStream())

      // when
      await store.get('foo')
      await store.get('bar')
      await store.get('baz')
      await store.save()

      //
      expect(client.query.update).not.to.have.been.called
    })

    it('only saves changed resources', async function () {
      // given
      const store = new ResourceStore(client)
      query.construct.callsFake(async () => $rdf.dataset([
        $rdf.quad($rdf.namedNode('baz'), rdfs.label, $rdf.literal('foo')),
      ]).toStream())

      // when
      await store.get('foo')
      await store.get('bar')
      ;(await store.get('baz')).deleteOut(rdfs.label).addOut(rdfs.label, 'Baz changed')
      await store.save()

      // then
      expect(client.query.update).to.have.been.calledOnce
      expect(query.update.firstCall.args[0]).to.matchSnapshot(this)
    })

    it('only deletes graph if all resource triples were removed', async function () {
      // given
      const store = new ResourceStore(client)
      query.construct.resolves($rdf.dataset([
        $rdf.quad($rdf.namedNode('baz'), rdfs.label, $rdf.literal('foo')),
        $rdf.quad($rdf.namedNode('baz'), rdfs.comment, $rdf.literal('bar')),
      ]).toStream())

      // when
      ;(await store.get('baz')).deleteOut()
      await store.save()

      // then
      expect(client.query.update).to.have.been.calledOnce
      expect(query.update.firstCall.args[0]).to.matchSnapshot(this)
    })

    it('does not save created resource if it has not triples', async function () {
      // given
      const store = new ResourceStore(client)

      // when
      await store.create(ex.Foo, { implicitlyDereferencable: false })
      await store.save()

      // then
      expect(client.query.update).not.to.have.been.called
    })
  })

  describe('delete', () => {
    it('delete is adding DROP SILENT GRAPH statement and removes from inserts', async function () {
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

describe('ResourceStore @SPARQL', () => {
  const testResource = ex.TestResource
  let store: ResourceStore

  beforeEach(async () => {
    store = new ResourceStore(new SparqlStoreFacade(ccClients.streamClient, () => ex.User))
    await DELETE`
      graph ?resource { ?rs ?rp ?ro }
      graph ?activity { ?as ?ap ?ao }
    `.WHERE`
      BIND ( ${ex.TestResource} as ?resource )

      OPTIONAL {
        graph ?resource { ?rs ?rp ?ro }
      }

      OPTIONAL {
        graph ?activity {
          ?activity ${as.object} ?resource .

          ?as ?ap ?ao .
        }
      }
    `.execute(ccClients.streamClient.query)
  })

  describe('created', () => {
    beforeEach(async () => {
      const ptr = store.create(testResource)
      ptr.addOut(rdf.type, schema.Person)
      await store.save()
    })

    it('inserts a as:Create resource', async () => {
      const activityCreated = ASK`GRAPH ?activity {
        ?activity a ${as.Create} ;
                  ${as.actor} ${ex.User} ;
                  ${as.object} ${testResource} ;
                  ${as.startTime} ?time ;
                  ${as.endTime} ?time ;
        .
      }`.execute(ccClients.streamClient.query)

      await expect(activityCreated).to.eventually.be.true
    })

    it('stores changed resource', async () => {
      const resourceCreated = ASK`
        ${testResource} a ${schema.Person} .
      `.FROM(testResource).execute(ccClients.streamClient.query)

      await expect(resourceCreated).to.eventually.be.true
    })
  })

  describe('updated', () => {
    beforeEach(async () => {
      await INSERT.DATA`
        graph ${testResource} {
          ${testResource} a ${schema.Person} ; ${schema.name} "john"
        }
      `.execute(ccClients.streamClient.query)

      const ptr = await store.get(testResource)
      ptr.addOut(schema.name, 'John')
      await store.save()
    })

    it('inserts a as:Update resource', async () => {
      const activityCreated = ASK`GRAPH ?activity {
        ?activity a ${as.Update} ;
                  ${as.actor} ${ex.User} ;
                  ${as.object} ${testResource} ;
                  ${as.startTime} ?time ;
                  ${as.endTime} ?time ;
        .
      }`.execute(ccClients.streamClient.query)

      await expect(activityCreated).to.eventually.be.true
    })

    it('stores changed resource', async () => {
      const resourceCreated = ASK`
        ${testResource} a ${schema.Person}; ${schema.name} "John" .
      `.FROM(testResource).execute(ccClients.streamClient.query)

      await expect(resourceCreated).to.eventually.be.true
    })
  })

  describe('delete', () => {
    beforeEach(async () => {
      await INSERT.DATA`
        graph ${testResource} {
          ${testResource} a ${schema.Person}
        }
      `.execute(ccClients.streamClient.query)

      store.delete(testResource)
      await store.save()
    })

    it('removes resource data', async () => {
      const resourceExists = ASK`
        ?s ?p ?o
      `.FROM(testResource).execute(ccClients.streamClient.query)

      await expect(resourceExists).to.eventually.be.false
    })

    it('inserts a as:Delete resource', async () => {
      const activityCreated = ASK`GRAPH ?activity {
        ?activity a ${as.Delete} ;
                  ${as.actor} ${ex.User} ;
                  ${as.object} ${testResource} ;
                  ${as.startTime} ?time ;
                  ${as.endTime} ?time ;
        .
      }`.execute(ccClients.streamClient.query)

      await expect(activityCreated).to.eventually.be.true
    })
  })
})
