import { NamedNode } from 'rdf-js'
import { describe, it, beforeEach } from 'mocha'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import { fromPointer as keyEntityPair } from '@rdfine/prov/lib/KeyEntityPair'
import { GraphPointer } from 'clownface'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import namespace from '@rdfjs/namespace'
import TermSet from '@rdfjs/term-set'
import { prov } from '@tpluscode/rdf-ns-builders'
import { blankNode, namedNode } from '@cube-creator/testing/clownface'
import '../../../lib/domain'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { KeyEntityPair } from '@rdfine/prov'

const wtd = namespace('http://www.wikidata.org/entity/')

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
      const dictionary = fromPointer(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }],
      })
      const unmappedKeys = new TermSet([
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

    it('skips keys which already have entries', () => {
      // given
      const dictionary = fromPointer(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }, {
          pairKey: 'As',
        }],
      })
      const unmappedKeys = new TermSet([
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
    it('returns true when entries are added', () => {
      // given
      const dictionary = fromPointer(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }],
      })

      // when
      const result = dictionary.replaceEntries([
        keyEntityPair(blankNode(), {
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }),
        keyEntityPair(blankNode(), {
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }),
      ])

      // then
      expect(result).to.be.true
    })

    it('returns true when entries are removed', () => {
      // given
      const dictionary = fromPointer(pointer, {
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: wikidata.sulphurDioxide,
        }, {
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })

      // when
      const result = dictionary.replaceEntries([
        keyEntityPair(blankNode(), {
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }),
      ])

      // then
      expect(result).to.be.true
    })

    it('returns true when entries are exactly the same', () => {
      // given
      const dictionary = fromPointer(pointer, {
        hadDictionaryMember: [{
          pairKey: 'co',
          pairEntity: wikidata.carbonMonoxide,
        }],
      })

      // when
      const so: Initializer<KeyEntityPair> = {
        pairKey: 'co',
        pairEntity: wikidata.carbonMonoxide,
      }
      const result = dictionary.replaceEntries([
        keyEntityPair(blankNode(), so),
      ])

      // then
      expect(result).to.be.false
    })
  })
})
