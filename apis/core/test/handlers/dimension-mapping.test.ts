import type { Literal } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { Request } from 'express'
import sinon from 'sinon'
import { expect } from 'chai'
import $rdf from '@cube-creator/env'
import { prov } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@cube-creator/testing/clownface'
import { ex } from '@cube-creator/testing/lib/namespace'
import { prepareEntries } from '../../lib/handlers/dimension-mapping.js'
import * as queries from '../../lib/domain/queries/dimension-mappings.js'
import '../../lib/domain/index.js'

describe('lib/handlers/dimension-mapping', () => {
  describe('prepareEntries', () => {
    const req = {
      headers: {},
    } as Request
    let unmappedTerms: Set<Literal>

    beforeEach(() => {
      unmappedTerms = $rdf.termSet()

      sinon.restore()
      sinon.stub(queries, 'getUnmappedValues').callsFake(async () => unmappedTerms)
    })

    it('add link to dimension to every entry', async () => {
      // given
      unmappedTerms.add($rdf.literal('Pb'))
      const sharedDimension = ex.dimension
      const mappings = namedNode('mappings')
      $rdf.rdfine.prov.Dictionary(mappings, {
        sharedDimension,
        hadDictionaryMember: [{
          pairKey: 'so2',
        }, {
          pairKey: 'As',
        }],
      })

      // when
      await prepareEntries(req, mappings)

      // then
      expect(mappings).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          minCount: 3,
          maxCount: 3,
        },
      })
    })

    it('maps base IRI of dictionary values to API namespace', async () => {
      // given
      const sharedDimension = ex.dimension
      const mappings = namedNode('mappings')
      $rdf.rdfine.prov.Dictionary(mappings, {
        sharedDimension,
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: $rdf.namedNode('https://ld.admin.ch/cube/dimension/foo/bar'),
        }],
      })

      // when
      await prepareEntries(req, mappings)

      // then
      expect(mappings).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
            property: [{
              path: prov.pairKey,
              hasValue: 'so2',
            }, {
              path: prov.pairEntity,
              hasValue: $rdf.namedNode('https://cube-creator.lndo.site/dimension/foo/bar'),
            }],
          },
        },
      })
    })

    it('does not add empty values for unmapped keys when preference is set', async () => {
      // given
      req.headers.prefer = 'only-mapped'
      unmappedTerms.add($rdf.literal('Pb'))
      const sharedDimension = ex.dimension
      const mappings = namedNode('mappings')
      $rdf.rdfine.prov.Dictionary(mappings, {
        sharedDimension,
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: $rdf.namedNode('https://ld.admin.ch/cube/dimension/foo/bar'),
        }],
      })

      // when
      await prepareEntries(req, mappings)

      // then
      expect(mappings).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
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
        },
      })
    })

    it('does not map canonical IRIs when prefer header is set', async () => {
      // given
      req.headers.prefer = 'return=canonical'
      const sharedDimension = ex.dimension
      const mappings = namedNode('mappings')
      $rdf.rdfine.prov.Dictionary(mappings, {
        sharedDimension,
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: $rdf.namedNode('https://ld.admin.ch/cube/dimension/foo/bar'),
        }],
      })

      // when
      await prepareEntries(req, mappings)

      // then
      expect(mappings).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
            property: [{
              path: prov.pairKey,
              hasValue: 'so2',
            }, {
              path: prov.pairEntity,
              hasValue: $rdf.namedNode('https://ld.admin.ch/cube/dimension/foo/bar'),
            }],
          },
        },
      })
    })

    it('does not map IRIs which are not in the canonical namespace', async () => {
      // given
      const sharedDimension = ex.dimension
      const mappings = namedNode('mappings')
      $rdf.rdfine.prov.Dictionary(mappings, {
        sharedDimension,
        hadDictionaryMember: [{
          pairKey: 'so2',
          pairEntity: $rdf.namedNode('https://test.ld.admin.ch/cube/dimension/foo/bar'),
        }],
      })

      // when
      await prepareEntries(req, mappings)

      // then
      expect(mappings).to.matchShape({
        property: {
          path: prov.hadDictionaryMember,
          node: {
            property: [{
              path: prov.pairKey,
              hasValue: 'so2',
            }, {
              path: prov.pairEntity,
              hasValue: $rdf.namedNode('https://test.ld.admin.ch/cube/dimension/foo/bar'),
            }],
          },
        },
      })
    })
  })
})
