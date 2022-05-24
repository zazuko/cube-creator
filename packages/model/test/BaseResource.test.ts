import { describe, it } from 'mocha'
import RdfResource from '@tpluscode/rdfine/RdfResource'
import { blankNode } from '@cube-creator/testing/clownface'
import { fromPointer } from '@rdfine/schema/lib/Thing'
import { expect } from 'chai'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { literal } from '@rdf-esm/data-model'
import { BaseResourceMixin } from '../BaseResource'

describe('@cube-creator/model/BaseResource', () => {
  describe('addError', () => {
    it('adds error when new', () => {
      // given
      const graph = blankNode()
        .addOut(schema.error, err => {
          err.addOut(schema.identifier, 'Current')
        })
      const resource = RdfResource.factory.createEntity(graph, [BaseResourceMixin])
      const error = fromPointer({
        identifierLiteral: 'my error',
      })

      // when
      resource.addError?.(error)

      // then
      expect(graph.out(schema.error).out(schema.identifier).terms).to.deep.contain.members([
        literal('Current'),
        literal('my error'),
      ])
    })

    it('does not add error when another already exists with same identifier', () => {
      // given
      const graph = blankNode()
        .addOut(schema.error, err => {
          err.addOut(schema.identifier, 'the error')
        })
      const resource = RdfResource.factory.createEntity(graph, [BaseResourceMixin])
      const error = fromPointer({
        identifierLiteral: 'the error',
      })

      // when
      resource.addError?.(error)

      // then
      expect(graph.out(schema.error).out(schema.identifier).term).to.deep.eq(literal('the error'))
    })
  })

  describe('removeError', () => {
    it('removes error by matching id', () => {
      // given
      const graph = blankNode()
        .addOut(schema.error, err => {
          err.addOut(schema.identifier, 'the error')
        })
      const resource = RdfResource.factory.createEntity(graph, [BaseResourceMixin])

      // when
      resource.removeError?.('the error')

      // then
      expect(graph.dataset.size).to.eq(0)
    })
  })
})
