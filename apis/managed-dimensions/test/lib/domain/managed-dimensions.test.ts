import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { mdClients, insertTestDimensions } from '@cube-creator/testing/lib'
import { getManagedDimensions, getManagedTerms } from '../../../lib/domain/managed-dimensions'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'

describe('@cube-creator/managed-dimensions-api/lib/domain/managed-dimensions @SPARQL', () => {
  before(async () => {
    await insertTestDimensions()
  })

  describe('getManagedDimensions', () => {
    it('returns from all graphs', async () => {
      // when
      const dataset = await $rdf.dataset()
        .import(await getManagedDimensions().execute(mdClients.streamClient.query))

      // then
      const termSets = [...dataset.match(null, rdf.type, schema.DefinedTermSet)].map(({ subject }) => subject)
      expect(termSets).to.deep.contain.members([
        $rdf.namedNode('http://example.com/dimension/colors'),
        $rdf.namedNode('http://example.com/dimension/countries'),
        $rdf.namedNode('http://example.com/dimension/chemicals'),
      ])
    })
  })

  describe('getManagedTerms', () => {
    const managedDimension = $rdf.namedNode('http://example.com/dimension/colors')

    it('returns terms for a given dimension', async () => {
      // when
      const dataset = await $rdf.dataset()
        .import(await getManagedTerms(managedDimension).execute(mdClients.streamClient.query))

      // then
      expect(dataset.match(null, rdf.type, schema.DefinedTerm))
        .to.have.property('size', 3)
      expect(dataset).to.matchShape({
        targetClass: schema.DefinedTerm,
        property: [{
          path: schema.inDefinedTermSet,
          hasValue: managedDimension,
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
  })
})
