import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { mdClients } from '@cube-creator/testing/lib'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import { getSharedDimensions, getSharedTerms } from '../../../lib/domain/shared-dimensions'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'

describe('@cube-creator/shared-dimensions-api/lib/domain/shared-dimensions @SPARQL', () => {
  before(async () => {
    await insertTestDimensions()
  })

  describe('getSharedDimensions', () => {
    it('returns from all graphs', async () => {
      // when
      const dataset = await $rdf.dataset()
        .import(await getSharedDimensions().execute(mdClients.streamClient.query))

      // then
      const termSets = [...dataset.match(null, rdf.type, schema.DefinedTermSet)].map(({ subject }) => subject)
      expect(termSets).to.deep.contain.members([
        $rdf.namedNode('http://example.com/dimension/colors'),
        $rdf.namedNode('http://example.com/dimension/countries'),
        $rdf.namedNode('http://example.com/dimension/chemicals'),
      ])
    })
  })

  describe('getSharedTerms', () => {
    const sharedDimension = $rdf.namedNode('http://example.com/dimension/colors')

    it('returns terms for a given dimension', async () => {
      // given
      const search = {
        sharedDimension,
        freetextQuery: undefined,
      }

      // when
      const dataset = await $rdf.dataset()
        .import(await getSharedTerms(search).execute(mdClients.streamClient.query))

      // then
      expect(dataset.match(null, rdf.type, schema.DefinedTerm))
        .to.have.property('size', 3)
      expect(dataset).to.matchShape({
        targetClass: schema.DefinedTerm,
        property: [{
          path: schema.inDefinedTermSet,
          hasValue: sharedDimension,
          minCount: 1,
          maxCount: 1,
        }, {
          path: schema.name,
          minCount: 1,
        }, {
          path: schema.identifier,
          minCount: 1,
        }],
      })
    })

    it('returns top N terms', async () => {
      // given
      const search = {
        sharedDimension,
        freetextQuery: undefined,
        limit: 1,
      }

      // when
      const dataset = await $rdf.dataset()
        .import(await getSharedTerms(search).execute(mdClients.streamClient.query))

      // then
      expect(dataset.match(null, rdf.type, schema.DefinedTerm))
        .to.have.property('size', 1)
    })

    it('returns terms filtered by input, case-insensitive', async () => {
      // given
      const search = {
        sharedDimension,
        freetextQuery: 'r',
      }
      // when
      const dataset = await $rdf.dataset()
        .import(await getSharedTerms(search).execute(mdClients.streamClient.query))

      // then
      const [term, ...more] = dataset.match(null, rdf.type, schema.DefinedTerm)
      expect(more).to.have.length(0)
      expect(term.subject).to.deep.eq($rdf.namedNode('http://example.com/dimension/colors/red'))
    })

    it('returns terms only valid terms', async () => {
      // given
      const search = {
        sharedDimension,
        freetextQuery: undefined,
        validThrough: new Date(Date.parse('2021-04-15')),
      }
      // when
      const dataset = await $rdf.dataset()
        .import(await getSharedTerms(search).execute(mdClients.streamClient.query))

      // then
      const terms = [...dataset.match(null, rdf.type, schema.DefinedTerm)].map(({ subject }) => subject)
      expect(terms).to.have.length(2)
      expect(terms).to.deep.contain.all.members([
        $rdf.namedNode('http://example.com/dimension/colors/blue'),
        $rdf.namedNode('http://example.com/dimension/colors/green'),
      ])
    })
  })
})
