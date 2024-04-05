import { describe, it } from 'mocha'
import { blankNode } from '@cube-creator/testing/clownface'
import { expect } from 'chai'
import { schema } from '@tpluscode/rdf-ns-builders'
import $rdf from '@cube-creator/env'
import { BaseResourceMixin } from '../BaseResource.js'

describe('@cube-creator/model/BaseResource', () => {
  describe('addError', () => {
    it('adds error when new', () => {
      // given
      const graph = blankNode()
        .addOut(schema.error, err => {
          err.addOut(schema.identifier, 'Current')
        })
      const resource = $rdf.rdfine().factory.createEntity(graph, [BaseResourceMixin])
      const error = $rdf.rdfine.schema.Thing({
        identifierLiteral: 'my error',
      })

      // when
      resource.addError?.(error)

      // then
      expect(graph.out(schema.error).out(schema.identifier).terms).to.deep.contain.members([
        $rdf.literal('Current'),
        $rdf.literal('my error'),
      ])
    })

    it('does not add error when another already exists with same identifier', () => {
      // given
      const graph = blankNode()
        .addOut(schema.error, err => {
          err.addOut(schema.identifier, 'the error')
        })
      const resource = $rdf.rdfine().factory.createEntity(graph, [BaseResourceMixin])
      const error = $rdf.rdfine.schema.Thing({
        identifierLiteral: 'the error',
      })

      // when
      resource.addError?.(error)

      // then
      expect(graph.out(schema.error).out(schema.identifier).term).to.deep.eq($rdf.literal('the error'))
    })
  })

  describe('removeError', () => {
    it('removes error by matching id', () => {
      // given
      const graph = blankNode()
        .addOut(schema.error, err => {
          err.addOut(schema.identifier, 'the error')
        })
      const resource = $rdf.rdfine().factory.createEntity(graph, [BaseResourceMixin])

      // when
      resource.removeError?.('the error')

      // then
      expect(graph.dataset.size).to.eq(0)
    })
  })
})
