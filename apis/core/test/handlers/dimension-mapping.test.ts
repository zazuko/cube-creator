import { describe, it, beforeEach } from 'mocha'
import { Request } from 'express'
import sinon from 'sinon'
import TermSet from '@rdfjs/term-set'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { prov } from '@tpluscode/rdf-ns-builders'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import { prepareEntries } from '../../lib/handlers/dimension-mapping'
import { namedNode } from '../support/clownface'
import { ex } from '../support/namespace'
import * as queries from '../../lib/domain/queries/dimension-mappings'
import '../../lib/domain'
import { Literal } from 'rdf-js'

describe('lib/handlers/dimension-mapping', () => {
  describe('addMissingEntries', () => {
    const req = {} as Request
    let unmappedTerms: Set<Literal>

    beforeEach(() => {
      unmappedTerms = new TermSet()

      sinon.restore()
      sinon.stub(queries, 'getUnmappedValues').callsFake(async () => unmappedTerms)
    })

    it('add link to dimension to every entry', async () => {
      // given
      unmappedTerms.add($rdf.literal('Pb'))
      const managedDimension = ex.dimension
      const mappings = namedNode('mappings')
      fromPointer(mappings, {
        managedDimension: managedDimension,
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
  })
})
