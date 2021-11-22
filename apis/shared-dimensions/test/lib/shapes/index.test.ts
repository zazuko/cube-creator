import { describe, it, beforeEach } from 'mocha'
import { Request } from 'express'
import sinon from 'sinon'
import { blankNode, namedNode } from '@cube-creator/testing/clownface'
import { dcterms, hydra, qudt, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import shapes from '../../../lib/shapes'
import * as ns from '../../../lib/namespace'

describe('@cube-creator/shared-dimensions-api/lib/shapes', () => {
  let shape: GraphPointer<NamedNode>
  let req: Request
  let header: sinon.SinonStub

  beforeEach(() => {
    header = sinon.stub()
    req = {
      header,
    } as any
  })

  describe('shared-dimensions-create', () => {
    beforeEach(async () => {
      shape = await shapes.get(ns.shape['shape/shared-dimension-create'])!(req)
    })

    describe('New dimension', () => {
      it('is valid when resource has all required props', () => {
        // given
        const resource = blankNode()
          .addOut(md.createAs, 'New dimension')
          .addOut(dcterms.identifier, $rdf.literal('test'))
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

    describe('Import', () => {
      it('is valid when resource has all required props', () => {
        // given
        const resource = blankNode()
          .addOut(md.createAs, 'Import')
          .addOut(md.export, 'cantons.trig')

        // then
        expect(resource).to.matchShape(shape)
      })
    })
  })

  describe('shared-dimensions-update', () => {
    beforeEach(async () => {
      shape = await shapes.get(ns.shape['shape/shared-dimension-update'])!(req)
    })

    it('allows dcterms:identifier', () => {
      // given
      const resource = blankNode()
        .addOut(rdf.type, [hydra.Resource, schema.DefinedTermSet, md.SharedDimension, meta.SharedDimension])
        .addOut(dcterms.identifier, $rdf.literal('test'))
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

  describe('shared-dimension-term-create', () => {
    beforeEach(async () => {
      shape = await shapes.get(ns.shape['shape/shared-dimension-term-create'])!(req)
    })

    it('is valid when a term has only names', () => {
      // given
      const resource = blankNode()
        .addOut(dcterms.identifier, $rdf.literal('test'))
        .addOut(schema.name, [$rdf.literal('Foo', 'en'), $rdf.literal('bar', 'de')])

      // then
      expect(resource).to.matchShape(shape)
    })

    it('is valid when a term has many identifiers', () => {
      // given
      const resource = blankNode()
        .addOut(dcterms.identifier, $rdf.literal('test'))
        .addOut(schema.name, $rdf.literal('Foo', 'en'))
        .addOut(schema.identifier, ['a', 'b', 'c'])

      // then
      expect(resource).to.matchShape(shape)
    })
  })

  describe('shared-dimension-term-update', () => {
    beforeEach(async () => {
      shape = await shapes.get(ns.shape['shape/shared-dimension-term-update'])!(req)
    })

    let term: GraphPointer

    beforeEach(() => {
      term = blankNode()
        .addOut(schema.name, $rdf.literal('Foo', 'en'))
        .addOut(rdf.type, [schema.DefinedTerm, md.SharedDimensionTerm])
        .addOut(schema.inDefinedTermSet, namedNode('term-set'))
    })

    it('passes validation when complete', () => {
      expect(term).to.matchShape(shape)
    })

    it('is not valid when a term does not have the required RDF type', () => {
      // given
      term.deleteOut(rdf.type)

      // then
      expect(term).not.to.matchShape(shape)
    })

    it('is not valid when a term does not have a term set', () => {
      // given
      term.deleteOut(schema.inDefinedTermSet)

      // then
      expect(term).not.to.matchShape(shape)
    })

    it('is not valid when a term does not have types', () => {
      // given
      term.deleteOut(rdf.type)

      // then
      expect(term).not.to.matchShape(shape)
    })
  })
})
