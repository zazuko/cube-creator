import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { namedNode } from '@cube-creator/testing/clownface'
import { hydra, rdf, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { create, createTerm } from '../../../lib/domain/shared-dimension'
import { SharedDimensionsStore } from '../../../lib/store'
import { testStore } from '../../support/store'
import $rdf from 'rdf-ext'

describe('@cube-creator/shared-dimensions-api/lib/domain/shared-dimension', () => {
  describe('create', () => {
    let store: SharedDimensionsStore

    beforeEach(() => {
      store = testStore()
    })

    it('generates a unique id derived from dimension name', async () => {
      // given
      const resource = namedNode('')
        .addOut(schema.name, 'canton')

      // when
      const termSet = await create({ resource, store })

      // then
      expect(termSet.value).to.match(/\/canton-.+$/)
    })

    it('saves to the store', async () => {
      // given
      const resource = namedNode('')
        .addOut(schema.name, 'canton')

      // when
      await create({ resource, store })

      // then
      expect(store.save).to.have.been.called
    })

    it('adds required RDF types', async () => {
      // given
      const resource = namedNode('')
        .addOut(schema.name, 'canton')

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
  })

  describe('createTerm', () => {
    it("copies term set's validFrom data", async () => {
      // given
      const termSet = namedNode('term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(schema.name, 'Term')

      // when
      const term = await createTerm({
        store: testStore(),
        termSet,
        resource,
      })

      // then
      expect(term.out(schema.validFrom).term).to.deep.eq(termSet.out(schema.validFrom).term)
    })

    it('derives URI from the term set and slugifies the name', async () => {
      // given
      const termSet = namedNode('term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(schema.name, 'Term')

      // when
      const term = await createTerm({
        store: testStore(),
        termSet,
        resource,
      })

      // then
      expect(term.value).to.match(/term-set\/term-.+$/)
    })

    it('derives URI from the term set and slugifies the name', async () => {
      // given
      const termSet = namedNode('term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-02', xsd.date))
      const resource = namedNode('')
        .addOut(schema.name, 'Term')

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
})
