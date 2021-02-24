import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { namedNode } from '@cube-creator/testing/clownface'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { create } from '../../../lib/domain/managed-dimension'
import { ManagedDimensionsStore } from '../../../lib/store'
import { testStore } from '../../support/store'

describe('@cube-creator/managed-dimensions-api/lib/domain/managed-dimension', () => {
  describe('create', () => {
    let store: ManagedDimensionsStore

    beforeEach(() => {
      store = testStore()
    })

    it('generates a unique id derived from dimension name', async () => {
      // given
      const resource = namedNode('')
        .addOut(schema.name, 'canton')

      // when
      const termSet = await create({ resource, store })

      // then
      expect(termSet.value).to.match(/\/canton-.+$/)
    })

    it('saves to the store', async () => {
      // given
      const resource = namedNode('')
        .addOut(schema.name, 'canton')

      // when
      await create({ resource, store })

      // then
      expect(store.save).to.have.been.called
    })

    it('adds required RDF types', async () => {
      // given
      const resource = namedNode('')
        .addOut(schema.name, 'canton')

      // when
      const termSet = await create({ resource, store })

      // then
      expect(termSet).to.matchShape({
        property: [{
          path: rdf.type,
          hasValue: [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension],
          minCount: 4,
          maxCount: 4,
        }],
      })
    })
  })
})
