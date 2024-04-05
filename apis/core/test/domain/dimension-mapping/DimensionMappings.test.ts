import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import type { GraphPointer } from 'clownface'
import { expect } from 'chai'
import $rdf from '@cube-creator/env'
import { prov, rdf, xsd } from '@tpluscode/rdf-ns-builders'
import { blankNode, namedNode } from '@cube-creator/testing/clownface'
import '../../../lib/domain/index.js'

const wtd = $rdf.namespace('http://www.wikidata.org/entity/')

const wikidata = {
  arsenic: wtd.Q871,
  lead: wtd.Q708,
  carbonMonoxide: wtd.Q2025,
  sulphurDioxide: wtd.Q5282,
}

describe('lib/domain/DimensionMappings', () => {
  let pointer: GraphPointer<NamedNode>

  beforeEach(() => {
    pointer = namedNode('mapping')
  })

  describe('addMissingEntries', function () {
    it('creates prov:KeyEntityPairs for missing keys', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }],
      })
      const unmappedKeys = $rdf.termSet([
        $rdf.literal('As'),
        $rdf.literal('Pb'),
      ])

      // when
      dictionary.addMissingEntries(unmappedKeys)

      // then
      expect(dictionary).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 3,
          maxCount: 3,
          node: {
            xone: [{
              property: [{
                path: prov.pairKey,
                hasValue: 'As',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'Pb',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'so2',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.sulphurDioxide,
                minCount: 1,
                maxCount: 1,
              }],
            }],
          },
        },
      })
    })

    it('uses string value for keys', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer)
      const unmappedKeys = $rdf.termSet([
        $rdf.literal('1', xsd.integer),
        $rdf.literal('foobar', xsd.anyAtomicType),
      ])

      // when
      dictionary.addMissingEntries(unmappedKeys)

      // then
      expect(dictionary).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 2,
          maxCount: 2,
          node: {
            xone: [{
              property: [{
                path: prov.pairKey,
                hasValue: '1',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'foobar',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }],
          },
        },
      })
    })

    it('skips keys which already have entries', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }, {
          pairKey: 'As',
        }],
      })
      const unmappedKeys = $rdf.termSet([
        $rdf.literal('so2'),
        $rdf.literal('As'),
      ])

      // when
      dictionary.addMissingEntries(unmappedKeys)

      // then
      expect(dictionary).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 2,
          maxCount: 2,
          node: {
            xone: [{
              property: [{
                path: prov.pairKey,
                hasValue: 'As',
              }, {
                path: prov.pairEntity,
                maxCount: 0,
              }],
            }, {
              property: [{
                path: prov.pairKey,
                hasValue: 'so2',
              }, {
                path: prov.pairEntity,
                hasValue: wikidata.sulphurDioxide,
                minCount: 1,
                maxCount: 1,
              }],
            }],
          },
        },
      })
    })
  })

  describe('replaceEntries', () => {
    it('adds rdf:type to all dictionary entries', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer)

      // when
      const newEntries = blankNode()
      $rdf.rdfine.prov.Dictionary(newEntries, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }, {
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })
      dictionary.replaceEntries(newEntries)

      // then
      expect(dictionary.pointer.out(prov.hadDictionaryMember).has(rdf.type, prov.KeyEntityPair).terms)
        .have.length(2)
    })

    it('returns true when entries are added', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }],
      })

      // when
      const newEntries = blankNode()
      $rdf.rdfine.prov.Dictionary(newEntries, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }, {
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })
      const { entriesChanged } = dictionary.replaceEntries(newEntries)

      // then
      expect(entriesChanged).to.be.true
    })

    it('returns true when entries are removed', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }, {
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })

      // when
      const newEntries = blankNode()
      $rdf.rdfine.prov.Dictionary(newEntries, {
        hadDictionaryMember: [{
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })
      const { entriesChanged } = dictionary.replaceEntries(newEntries)

      // then
      expect(entriesChanged).to.be.true
    })

    it('returns true when entries are exactly the same', () => {
      // given
      const dictionary = $rdf.rdfine.prov.Dictionary(pointer, {
        hadDictionaryMember: [{
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })

      // when
      const newEntries = blankNode()
      $rdf.rdfine.prov.Dictionary(newEntries, {
        hadDictionaryMember: [{
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })
      const { entriesChanged } = dictionary.replaceEntries(newEntries)

      // then
      expect(entriesChanged).to.be.false
    })
  })
})
