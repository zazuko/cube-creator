import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { GraphPointer } from 'clownface'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import namespace from '@rdfjs/namespace'
import httpError from 'http-errors'
import { update } from '../../../lib/domain/dimension-mapping/update'
import { TestResourceStore } from '../../support/TestResourceStore'
import { blankNode, namedNode } from '../../support/clownface'
import * as queries from '../../../lib/domain/queries/dimension-mappings'
import { ex } from '../../support/namespace'

const wtd = namespace('http://www.wikidata.org/entity/')

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
      .addOut(schema.about, dimension)
      .addOut(cc.managedDimension, ex('managed-dimension/chemical-substance'))
      .addOut(prov.hadDictionaryMember, member => {
        member
          .addOut(prov.pairKey, 'co')
          .addOut(prov.pairEntity, wikidata.carbonMonoxide)
      })
      .addOut(prov.hadDictionaryMember, member => {
        member
          .addOut(prov.pairKey, 'so2')
      })

    store = new TestResourceStore([
      dimensionMapping,
    ])

    sinon.restore()
    sinon.stub(queries, 'replaceValueWithDefinedTerms')
  })

  it('throws if dimension is missing', async () => {
    // given
    const mappings = blankNode()
      .addOut(cc.managedDimension, ex('managed-dimension/chemical-substance'))

    // when
    const promise = update({
      resource,
      mappings,
      store,
    })

    await expect(promise).to.have.rejectedWith(httpError.BadRequest)
  })

  describe('adding new mapped values', () => {
    beforeEach(async () => {
      // given
      const mappings = blankNode()
        .addOut(schema.about, dimension)
        .addOut(cc.managedDimension, ex('managed-dimension/chemical-substance'))
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

      // when
      await update({
        resource,
        mappings,
        store,
      })
    })

    it('calls update query to update cube shape and observations', async () => {
      expect(queries.replaceValueWithDefinedTerms).to.have.been.calledWith(sinon.match(({ terms }: Parameters<typeof queries.replaceValueWithDefinedTerms>[0]) => {
        return terms.size === 2 &&
          terms.get('As')?.equals(wikidata.arsenic) &&
          terms.get('Pb')?.equals(wikidata.lead)
      }))
    })

    it('creates new dictionary entries for added key', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 4,
          maxCount: 4,
          property: [{
            path: prov.pairKey,
            minCount: 1,
            maxCount: 1,
          }, {
            path: prov.pairEntity,
            minCount: 0,
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
      const mappings = blankNode()
        .addOut(schema.about, dimension)
        .addOut(cc.managedDimension, ex('managed-dimension/chemical-substance'))
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

    it('calls update query to update cube shape and observations', async () => {
      expect(queries.replaceValueWithDefinedTerms).to.have.been.calledWith(sinon.match(({ dimensionMapping, terms }: Parameters<typeof queries.replaceValueWithDefinedTerms>[0]) => {
        return dimensionMapping.equals(resource) && terms.size === 1 && terms.get('so2')?.equals(wikidata.sulphurDioxide)
      }))
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
      const mappings = blankNode()
        .addOut(schema.about, dimension)
        .addOut(cc.managedDimension, ex('managed-dimension/chemical-substance'))
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

    it('does not call sparql update', async () => {
      expect(queries.replaceValueWithDefinedTerms).not.to.have.been.called
    })

    it('update dictionary entry', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 2,
          maxCount: 2,
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
  })

  describe('removing entries', () => {
    beforeEach(async () => {
      // given
      const mappings = blankNode()
        .addOut(schema.about, dimension)
        .addOut(cc.managedDimension, ex('managed-dimension/chemical-substance'))
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

    it('does not call sparql update', async () => {
      expect(queries.replaceValueWithDefinedTerms).not.to.have.been.called
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
  })

  describe('changing managed dimension', () => {
    beforeEach(async () => {
      // given
      const mappings = blankNode()
        .addOut(schema.about, dimension)
        .addOut(cc.managedDimension, ex('managed-dimension/canton'))
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
    })

    it('updates managed dimension', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: cc.managedDimension,
          hasValue: ex('managed-dimension/canton'),
          minCount: 1,
          maxCount: 1,
        },
      })
    })

    it('removes all entries', () => {
      expect(dimensionMapping).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          maxCount: 0,
          minCount: 0,
        },
      })
      expect(dimensionMapping.any().has([prov.pairKey, prov.pairEntity]).terms).to.have.length(0)
    })
  })
})
