import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { mdClients, insertTestDimensions } from '@cube-creator/testing/lib'
import { getManagedDimensions, getManagedTerms } from '../../../lib/domain/managed-dimensions'
import { hydra, schema } from '@tpluscode/rdf-ns-builders'

describe('@cube-creator/managed-dimensions-api/lib/domain/managed-dimensions @SPARQL', () => {
  before(async () => {
    await insertTestDimensions()
  })

  describe('getManagedDimensions', () => {
    const managedDimension = $rdf.namedNode('http://example.com/managed-dimensions')

    it('returns from all graphs', async () => {
      // when
      const dataset = await $rdf.dataset()
        .import(await getManagedDimensions(managedDimension).execute(mdClients.streamClient.query))

      // then
      expect(dataset).to.matchShape({
        targetNode: [managedDimension],
        property: {
          path: hydra.member,
          hasValue: [
            $rdf.namedNode('http://example.com/dimension/colors'),
            $rdf.namedNode('http://example.com/dimension/countries'),
            $rdf.namedNode('http://example.com/dimension/chemicals'),
          ],
          minCount: 3,
        },
      })
    })
  })

  describe('getManagedTerms', () => {
    const managedDimension = $rdf.namedNode('http://example.com/dimension/colors')
    const collection = $rdf.namedNode('http://example.com/terms')

    it('returns terms for a given dimension', async () => {
      // when
      const dataset = await $rdf.dataset()
        .import(await getManagedTerms(managedDimension, collection).execute(mdClients.streamClient.query))

      // then
      expect(dataset).to.matchShape({
        targetNode: [collection],
        property: {
          path: hydra.member,
          minCount: 3,
          maxCount: 3,
          node: {
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
          },
        },
      })
    })
  })
})
