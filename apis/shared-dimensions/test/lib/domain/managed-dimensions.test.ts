import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { mdClients } from '@cube-creator/testing/lib'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import { rdf, rdfs, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { getSharedDimensions, getSharedTerms } from '../../../lib/domain/shared-dimensions'

describe('@cube-creator/shared-dimensions-api/lib/domain/shared-dimensions @SPARQL', () => {
  before(async () => {
    await insertTestDimensions()
  })

  describe('getSharedDimensions', () => {
    it('returns from all graphs', async () => {
      // given
      const collectionData = await getSharedDimensions(mdClients.streamClient)

      // when
      const dataset = $rdf.dataset([
        ...collectionData.members,
      ])

      // then
      const termSets = [...dataset.match(null, rdf.type, schema.DefinedTermSet)].map(({ subject }) => subject)
      expect(termSets).to.deep.contain.members([
        $rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies'),
        $rdf.namedNode('http://example.com/dimension/countries'),
        $rdf.namedNode('http://example.com/dimension/chemicals'),
      ])
    })

    it('returns filtered by name', async () => {
      // given
      const collectionData = await getSharedDimensions(mdClients.streamClient, {
        freetextQuery: 'techno',
      })

      // when
      const dataset = $rdf.dataset([
        ...collectionData.members,
      ])

      // then
      const termSets = [...dataset.match(null, rdf.type, schema.DefinedTermSet)].map(({ subject }) => subject)
      expect(termSets).to.have.length(1)
      expect(termSets).to.deep.contain.members([
        $rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies'),
      ])
    })

    it('returns filtered to include deprecated', async () => {
      // given
      const collectionData = await getSharedDimensions(mdClients.streamClient, {
        freetextQuery: 'colors',
        includeDeprecated: $rdf.literal('true', xsd.boolean),
      })

      // when
      const dataset = $rdf.dataset([
        ...collectionData.members,
      ])

      // then
      const termSets = [...dataset.match(null, rdf.type, schema.DefinedTermSet)].map(({ subject }) => subject)
      expect(termSets).to.have.length(1)
      expect(termSets).to.deep.contain.members([
        $rdf.namedNode('http://example.com/dimension/colors'),
      ])
    })
  })

  describe('getSharedTerms', () => {
    it('returns terms for a given dimension', async () => {
      // given
      const search = {
        sharedDimensions: [$rdf.namedNode('http://example.com/dimension/colors')],
        freetextQuery: undefined,
      }
      const collectionData = await getSharedTerms(search, mdClients.streamClient)

      // when
      const dataset = await $rdf.dataset()
        .import(collectionData.members)

      // then
      expect(dataset.match(null, rdf.type, schema.DefinedTerm))
        .to.have.property('size', 3)
      expect(dataset).to.matchShape({
        targetClass: schema.DefinedTerm,
        property: [{
          path: schema.inDefinedTermSet,
          hasValue: $rdf.namedNode('http://example.com/dimension/colors'),
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

    it('returns terms with dynamic properties', async () => {
      // given
      const search = {
        sharedDimensions: [$rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies')],
        freetextQuery: 'sparql',
      }
      const collectionData = await getSharedTerms(search, mdClients.streamClient)

      // when
      const dataset = await $rdf.dataset()
        .import(collectionData.members)

      // then
      expect(dataset.match(null, rdf.type, schema.DefinedTerm))
        .to.have.property('size', 1)
      expect(dataset).to.matchShape({
        targetClass: schema.DefinedTerm,
        property: [{
          path: schema.color,
          hasValue: $rdf.namedNode('http://example.com/dimension/colors/red'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: rdfs.comment,
          hasValue: $rdf.literal('This term has dynamic properties', 'en'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('http://purl.org/linked-data/cube#order'),
          hasValue: 10,
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('returns top N terms', async () => {
      // given
      const search = {
        sharedDimensions: [$rdf.namedNode('http://example.com/dimension/colors')],
        freetextQuery: undefined,
        limit: 1,
      }
      const collectionData = await getSharedTerms(search, mdClients.streamClient)

      // when
      const dataset = await $rdf.dataset()
        .import(collectionData.members)

      // then
      expect(dataset.match(null, rdf.type, schema.DefinedTerm))
        .to.have.property('size', 1)
    })

    it('returns terms filtered by input, case-insensitive', async () => {
      // given
      const search = {
        sharedDimensions: [$rdf.namedNode('http://example.com/dimension/colors')],
        freetextQuery: 'r',
      }
      const collectionData = await getSharedTerms(search, mdClients.streamClient)

      // when
      const dataset = await $rdf.dataset()
        .import(collectionData.members)

      // then
      const [term, ...more] = dataset.match(null, rdf.type, schema.DefinedTerm)
      expect(more).to.have.length(0)
      expect(term.subject).to.deep.eq($rdf.namedNode('http://example.com/dimension/colors/red'))
    })

    it('returns terms only valid terms', async () => {
      // given
      const search = {
        sharedDimensions: [$rdf.namedNode('http://example.com/dimension/colors')],
        freetextQuery: undefined,
        validThrough: new Date(Date.parse('2021-04-15')),
      }
      const collectionData = await getSharedTerms(search, mdClients.streamClient)

      // when
      const dataset = await $rdf.dataset()
        .import(collectionData.members)

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
