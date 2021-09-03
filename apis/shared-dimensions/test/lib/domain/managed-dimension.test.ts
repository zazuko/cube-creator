import { describe, it, beforeEach, before } from 'mocha'
import { expect } from 'chai'
import { blankNode, namedNode } from '@cube-creator/testing/clownface'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import { mdClients } from '@cube-creator/testing/lib/index'
import { dcterms, hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { create, createTerm, update, getExportedDimension } from '../../../lib/domain/shared-dimension'
import { SharedDimensionsStore } from '../../../lib/store'
import { testStore } from '../../support/store'
import $rdf from 'rdf-ext'
import { DatasetCore } from 'rdf-js'
import httpError from 'http-errors'
import clownface from 'clownface'

describe('@cube-creator/shared-dimensions-api/lib/domain/shared-dimension', () => {
  describe('create', () => {
    let store: SharedDimensionsStore

    beforeEach(() => {
      store = testStore()
    })

    it('creates id using provided identifier', async () => {
      // given
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'canton')

      // when
      const termSet = await create({ resource, store })

      // then
      expect(termSet.value).to.eq('https://ld.admin.ch/cube/dimension/canton')
    })

    it('saves to the store', async () => {
      // given
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'canton')

      // when
      await create({ resource, store })

      // then
      expect(store.save).to.have.been.called
    })

    it('adds required RDF types', async () => {
      // given
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'canton')

      // when
      const termSet = await create({ resource, store })

      // then
      expect(termSet).to.matchShape({
        property: [{
          path: rdf.type,
          hasValue: [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension, md.SharedDimension],
          minCount: 4,
          maxCount: 4,
        }],
      })
    })

    it('throws if identifier is already used', async () => {
      // given
      await store.save(namedNode('https://cube-creator.lndo.site/shared-dimensions/term-set/canton'))
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'canton')

      // when
      const promise = create({ resource, store })

      // then
      expect(promise).eventually.rejectedWith(httpError.Conflict)
    })
  })

  describe('createTerm', () => {
    it("copies term set's validFrom data", async () => {
      // given
      const termSet = namedNode('http://example.com/term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'Term')

      // when
      const term = await createTerm({
        store: testStore(),
        termSet,
        resource,
      })

      // then
      expect(term.out(schema.validFrom).term).to.deep.eq(termSet.out(schema.validFrom).term)
    })

    it('creates URI from the term set and identifier', async () => {
      // given
      const termSet = namedNode('http://example.com/term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'term')

      // when
      const term = await createTerm({
        store: testStore(),
        termSet,
        resource,
      })

      // then
      expect(term.value).to.eq('http://example.com/term-set/term')
    })

    it('throws if identifier is already used', async () => {
      // given
      const store = testStore()
      await store.save(namedNode('https://cube-creator.lndo.site/shared-dimensions/term-set/canton/bern'))
      const termSet = namedNode('term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'bern')

      // when
      const promise = createTerm({
        store,
        termSet,
        resource,
      })

      // then
      expect(promise).eventually.rejectedWith(httpError.Conflict)
    })

    it('ensures rdf type', async () => {
      // given
      const termSet = namedNode('http://example.com/term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'Term')

      // when
      const term = await createTerm({
        store: testStore(),
        termSet,
        resource,
      })

      // then
      expect(term.out(rdf.type).terms).to.deep.contain(md.SharedDimensionTerm)
    })
  })

  describe('update', () => {
    it('removes all triples which are subgraph of sh:ignoreProperty', async () => {
      // given
      const shape = blankNode()
        .addList(sh.ignoredProperties, [schema.memberOf, dcterms.identifier])
      const resource = namedNode('')
        .addOut(dcterms.identifier, 'foo')
        .addOut(schema.name, 'Term set')
        .addOut(schema.memberOf, org => {
          org.addOut(rdf.type, schema.Organization)
        })

      // when
      const saved = await update({
        store: testStore(),
        shape,
        resource,
      })

      // expect
      expect(saved.dataset).to.have.property('size', 1)
      expect(saved.out(schema.name).value).to.eq('Term set')
    })
  })

  describe('getExportedDimension @SPARQL', () => {
    let dataset: DatasetCore

    const termSetId = $rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies')

    before(async function () {
      this.timeout(20000)
      await insertTestDimensions()

      const store = testStore()
      await store.save(namedNode(termSetId))

      const { data } = await getExportedDimension({
        resource: termSetId,
        store,
        client: mdClients.streamClient,
      })
      dataset = await $rdf.dataset().import(data)
    })

    it('exports set and terms', () => {
      const graph = clownface({ dataset })
      const termSet = graph.node(termSetId)

      // then
      expect(termSet.in(schema.inDefinedTermSet).terms).to.have.length(3)
    })

    it('exports shapes for set and terms', () => {
      const graph = clownface({ dataset })
      const termSet = graph.node(termSetId)
      const terms = termSet.in(schema.inDefinedTermSet)
      const haveShape = graph.node([termSet, ...terms.toArray()])

      // then
      expect(haveShape.in(sh.targetNode).terms).to.have.length(4)
    })

    it('exports dimension properties', () => {
      const dimension = clownface({ dataset }).node(termSetId)

      expect(dimension).to.matchShape({
        property: [{
          path: schema.validFrom,
          minCount: 1,
          maxCount: 1,
          hasValue: $rdf.literal('2021-01-20T23:59:59Z', xsd.dateTime),
        }, {
          path: schema.name,
          minCount: 1,
          maxCount: 1,
          hasValue: $rdf.literal('Technologies', 'en'),
        }],
      })
    })

    it('exports term properties', () => {
      const dimension = clownface({ dataset })
        .namedNode('https://ld.admin.ch/cube/dimension/technologies/rdf')

      expect(dimension).to.matchShape({
        property: [{
          path: schema.validFrom,
          minCount: 1,
          maxCount: 1,
          hasValue: $rdf.literal('2021-01-20T23:59:59Z', xsd.dateTime),
        }, {
          path: schema.name,
          minCount: 1,
          maxCount: 1,
          hasValue: $rdf.literal('RDF', 'en'),
        }, {
          path: schema.identifier,
          minCount: 1,
          maxCount: 1,
          hasValue: 'rdf',
        }],
      })
    })
  })
})
