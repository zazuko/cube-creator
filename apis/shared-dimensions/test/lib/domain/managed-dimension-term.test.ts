import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { namedNode } from '@cube-creator/testing/clownface'
import { DomainError } from '@cube-creator/api-errors'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import { updateTerm } from '../../../lib/domain/shared-dimension-term'
import { SharedDimensionsStore } from '../../../lib/store'
import { testStore } from '../../support/store'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'

describe('@cube-creator/shared-dimensions-api/lib/domain/sahred-dimension-term', () => {
  describe('updateTerm', () => {
    let store: SharedDimensionsStore
    let termSet: GraphPointer<NamedNode>
    let previous: GraphPointer<NamedNode>

    beforeEach(async () => {
      store = testStore()
      termSet = namedNode('term-set')
        .addOut(schema.validFrom, $rdf.literal('2000-10-10', xsd.dateTime))
      previous = namedNode('')
        .addOut(schema.inDefinedTermSet, termSet)
      await store.save(previous)
      await store.save(termSet)
    })

    it('throws if updated term changes the parent TermSet', () => {
      // given
      const term = namedNode('')
        .addOut(schema.name, 'canton')
        .addOut(schema.inDefinedTermSet, termSet)
      previous
        .deleteOut(schema.inDefinedTermSet)
        .addOut(schema.inDefinedTermSet, namedNode('other term set'))

      // then
      expect(updateTerm({ term, store })).to.have.rejectedWith(DomainError)
    })

    it('sets validFrom date from term set', async () => {
      // given
      const term = namedNode(previous.term)
        .addOut(schema.name, 'canton')
        .addOut(schema.inDefinedTermSet, termSet)

      // when
      const saved = await updateTerm({ term, store })

      // then
      expect(saved).to.matchShape({
        property: {
          path: schema.validFrom,
          hasValue: $rdf.literal('2000-10-10', xsd.dateTime),
          minCount: 1,
          maxCount: 1,
        },
      })
    })
  })
})
