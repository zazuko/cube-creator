import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import $rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import { prov, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import httpError from 'http-errors'
import { namedNode } from '@cube-creator/testing/clownface'
import { ex } from '@cube-creator/testing/lib/namespace'
import { update } from '../../../lib/domain/dimension-mapping/update.js'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import '../../../lib/domain/index.js'

const wtd = $rdf.namespace('http://www.wikidata.org/entity/')

const wikidata = {
  arsenic: wtd.Q871,
  lead: wtd.Q708,
  carbonMonoxide: wtd.Q2025,
  sulphurDioxide: wtd.Q5282,
}

describe('domain/dimension-mapping/update', () => {
  let store: TestResourceStore
  const resource = $rdf.namedNode('dimension-mappings')
  const dimension = $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/pollutant')

  let dimensionMapping: GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    dimensionMapping = namedNode(resource)
      .addOut(rdf.type, prov.Dictionary)
      .addOut(schema.about, dimension)
      .addOut(cc.sharedDimension, ex('http://example.com/dimension/chemicals'))
      .addOut(prov.hadDictionaryMember, member => {
        member
          .addOut(prov.pairKey, 'co')
          .addOut(prov.pairEntity, wikidata.carbonMonoxide)
      })
      .addOut(prov.hadDictionaryMember, member => {
        member
          .addOut(prov.pairKey, 'so2')
      })
    dimensionMapping.node(wikidata.carbonMonoxide)
      .addOut(rdf.type, prov.Entity)
    dimensionMapping.node(wikidata.sulphurDioxide)
      .addOut(rdf.type, prov.Entity)

    store = new TestResourceStore([
      dimensionMapping,
    ])

    sinon.restore()
  })

  it('throws if dimension is missing', async () => {
    // given
    const mappings = namedNode(resource)
      .addOut(rdf.type, prov.Dictionary)
      .addOut(cc.sharedDimension, ex('http://example.com/dimension/chemicals'))

    // when
    const promise = update({
      resource,
      mappings,
      store,
    })

    // then
    await expect(promise).to.have.rejectedWith(httpError.BadRequest)
  })

  describe('adding new mapped values', () => {
    beforeEach(async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        .addOut(cc.sharedDimension, $rdf.namedNode('http://example.com/dimension/chemicals'))
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'co')
            .addOut(prov.pairEntity, wikidata.carbonMonoxide)
        })
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'so2')
        })
        .addOut(prov.hadDictionaryMember, arsenic => {
          arsenic
            .addOut(prov.pairKey, 'As')
            .addOut(prov.pairEntity, wikidata.arsenic)
        })
        .addOut(prov.hadDictionaryMember, lead => {
          lead
            .addOut(prov.pairKey, 'Pb')
            .addOut(prov.pairEntity, wikidata.lead)
        })
        .addOut(prov.hadDictionaryMember, lead => {
          lead
            .addOut(prov.pairKey, 'Unmapped')
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })
    })

    it('skips entries with have placeholder entity', () => {
      expect(dimensionMapping).to.matchShape({
        not: {
          property: {
            path: prov.hadDictionaryMember,
            property: [{
              path: prov.pairKey,
              hasValue: 'Unmapped',
            }],
          },
        },
      })
    })

    it('creates new dictionary entries for added key', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 3,
          maxCount: 3,
          property: [{
            path: prov.pairEntity,
            minCount: 1,
            maxCount: 1,
          }],
          xone: [{
            property: {
              path: prov.pairKey,
              hasValue: 'co',
            },
          }, {
            property: {
              path: prov.pairKey,
              hasValue: 'As',
            },
          }, {
            property: {
              path: prov.pairKey,
              hasValue: 'Pb',
            },
          }],
        },
      })
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
            xone: [{
              property: [{
                path: prov.pairKey,
                hasValue: 'As',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.arsenic,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'Pb',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.lead,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'so2',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'co',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.carbonMonoxide,
              }],
            }],
          },
        },
      })
    })
  })

  describe('setting missing value for an entry', () => {
    beforeEach(async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        .addOut(cc.sharedDimension, ex('http://example.com/dimension/chemicals'))
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'co')
            .addOut(prov.pairEntity, wikidata.carbonMonoxide)
        })
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'so2')
            .addOut(prov.pairEntity, wikidata.sulphurDioxide)
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })
    })

    it('update dictionary entry', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 2,
          maxCount: 2,
          property: [{
            path: prov.pairKey,
            minCount: 1,
            maxCount: 1,
          }, {
            path: prov.pairEntity,
            minCount: 1,
            maxCount: 1,
          }],
        },
      })
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
            xone: [{
              property: [{
                path: prov.pairKey,
                hasValue: 'so2',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.sulphurDioxide,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'co',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.carbonMonoxide,
              }],
            }],
          },
        },
      })
    })
  })

  describe('removing value for a key', () => {
    beforeEach(async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        .addOut(cc.sharedDimension, ex('http://example.com/dimension/chemicals'))
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'co')
        })
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'so2')
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })
    })

    it('removes key/value pairs', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          maxCount: 0,
        },
      })
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
            xone: [{
              property: [{
                path: prov.pairKey,
                hasValue: 'so2',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'co',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }],
          },
        },
      })
    })

    it('removes rdf:type prov:Entity triples of removed pairs', () => {
      expect(dimensionMapping.node(wikidata.carbonMonoxide).out().terms).to.be.empty
    })

    it('removes all superfluous rdf:type prov:Entity triples', () => {
      expect(dimensionMapping.node(wikidata.sulphurDioxide).out().terms).to.be.empty
    })
  })

  describe('updating with "applyMapping" flag set to false', () => {
    beforeEach(async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        .addOut(cc.sharedDimension, ex('http://example.com/dimension/chemicals'))
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'co')
            .addOut(prov.pairEntity, wikidata.carbonMonoxide)
        })
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'so2')
            .addOut(prov.pairEntity, wikidata.sulphurDioxide)
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })
    })
  })

  describe('removing entries', () => {
    beforeEach(async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        .addOut(cc.sharedDimension, ex('http://example.com/dimension/chemicals'))
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'co')
            .addOut(prov.pairEntity, wikidata.carbonMonoxide)
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })
    })

    it('removes them from the graph', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          maxCount: 1,
          minCount: 1,
          property: {
            path: prov.pairKey,
            hasValue: 'co',
            maxCount: 1,
            minCount: 1,
          },
        },
      })
      expect(dimensionMapping.any().has([prov.pairKey, prov.pairEntity]).terms).to.have.length(2)
    })

    it('removes rdf:type prov:Entity triples of remaining pairs', () => {
      expect(dimensionMapping.node(wikidata.carbonMonoxide).out(rdf.type).terms).to.be.empty
    })
  })

  describe('changing shared dimension', () => {
    it('updates shared dimension', async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        .addOut(cc.sharedDimension, ex('shared-dimension/canton'))
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'co')
            .addOut(prov.pairEntity, wikidata.carbonMonoxide)
        })
        .addOut(prov.hadDictionaryMember, member => {
          member
            .addOut(prov.pairKey, 'so2')
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })

      expect(dimensionMapping).to.matchShape({
        property: {
          path: cc.sharedDimension,
          hasValue: ex('shared-dimension/canton'),
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('unlinks shared dimension', async () => {
      // given
      const mappings = namedNode(resource)
        .addOut(rdf.type, prov.Dictionary)
        .addOut(schema.about, dimension)
        // .addOut(cc.sharedDimension, undefined)
        .addOut(prov.hadDictionaryMember, member => {
          member.addOut(prov.pairKey, 'co')
        })
        .addOut(prov.hadDictionaryMember, member => {
          member.addOut(prov.pairKey, 'so2')
        })

      // when
      await update({
        resource,
        mappings,
        store,
      })

      expect(dimensionMapping).to.matchShape({
        property: {
          path: cc.sharedDimension,
          maxCount: 0,
        },
      })
    })
  })
})
