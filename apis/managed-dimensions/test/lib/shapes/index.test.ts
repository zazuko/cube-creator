import { describe, it, before } from 'mocha'
import { blankNode } from '@cube-creator/testing/clownface'
import { qudt, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import shapes from '../../../lib/shapes'
import * as ns from '../../../lib/namespace'

describe('@cube-creator/managed-dimensions-api/lib/shapes', () => {
  let shape: GraphPointer<NamedNode>

  describe('managed-dimensions', () => {
    before(() => {
      shape = shapes.get(ns.shape['shape/managed-dimension'])!()
    })

    it('is valid when resource has all required props', () => {
      // given
      const resource = blankNode()
        .addOut(schema.name, $rdf.literal('Test', 'en'))
        .addOut(sh.property, prop => {
          prop
            .addOut(qudt.scaleType, qudt.NominalScale)
            .addOut(rdf.type, schema.GeoShape)
            .addOut(schema.name, $rdf.literal('Test', 'en'))
        })

      // then
      expect(resource).to.matchShape(shape)
    })
  })

  describe('managed-dimension-term-create', () => {
    before(() => {
      shape = shapes.get(ns.shape['shape/managed-dimension-term-create'])!()
    })

    it('is valid when a term has only names', () => {
      // given
      const resource = blankNode()
        .addOut(schema.name, [$rdf.literal('Foo', 'en'), $rdf.literal('bar', 'de')])

      // then
      expect(resource).to.matchShape(shape)
    })

    it('is valid when a term has many identifiers', () => {
      // given
      const resource = blankNode()
        .addOut(schema.name, $rdf.literal('Foo', 'en'))
        .addOut(schema.identifier, ['a', 'b', 'c'])

      // then
      expect(resource).to.matchShape(shape)
    })
  })
})
