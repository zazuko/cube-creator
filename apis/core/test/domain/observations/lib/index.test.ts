import type { Term } from '@rdfjs/types'
import { describe, it, beforeEach, before } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import type { AnyPointer, GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { View } from 'rdf-cube-view-query/lib/View.js'
import Cube from 'rdf-cube-view-query/lib/Cube.js'
import Source from 'rdf-cube-view-query/lib/Source.js'
import * as ns from '@cube-creator/core/namespace'
import { hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders/loose'
import { IriTemplate } from '@rdfine/hydra'
import { populateFilters, createHydraCollection, createView } from '../../../../lib/domain/observations/lib/index.js'

describe('lib/domain/observations/lib', () => {
  describe('createView', () => {
    it('initializes a projection with view:limit and view:offset', () => {
      // given
      const cube = new Cube({
        source: new Source({ endpointUrl: '' }),
      })
      cube.ptr
        .addOut(ns.cube.observationConstraint, shape => {
          shape.addOut(sh.property, schema.name)
        })

      // when
      const { ptr } = createView(cube, 10, 100)

      // then
      expect(ptr).to.matchShape({
        property: [{
          path: ns.view.projection,
          node: {
            property: [
              {
                path: ns.view.limit,
                hasValue: $rdf.literal('10', xsd.integer),
              },
              {
                path: ns.view.offset,
                hasValue: $rdf.literal('100', xsd.integer),
              },
            ],
          },
        }],
      })
    })
  })

  describe('populateFilters', () => {
    let filter: AnyPointer
    let view: View
    let dimension: sinon.SinonStub

    beforeEach(() => {
      filter = $rdf.clownface()
      dimension = sinon.stub()
      view = {
        ptr: $rdf.clownface().blankNode(),
        dimension,
      } as any as View
    })

    it('skip filter without dimension', () => {
      // given
      filter.blankNode()
        .addOut(ns.view.operation, ns.view.Gte)
        .addOut(ns.view.argument, '18')

      // when
      populateFilters(view, filter)

      // then
      expect(view.ptr.dataset).to.have.length(0)
    })

    it('skip filter without argument', () => {
      // given
      filter.blankNode()
        .addOut(ns.view.dimension, schema.age)
        .addOut(ns.view.operation, ns.view.Gte)

      // when
      populateFilters(view, filter)

      // then
      expect(view.ptr.dataset).to.have.length(0)
    })

    it('skip filter without operation', () => {
      // given
      filter.blankNode()
        .addOut(ns.view.dimension, schema.age)
        .addOut(ns.view.argument, '18')

      // when
      populateFilters(view, filter)

      // then
      expect(view.ptr.dataset).to.have.length(0)
    })

    it('adds all filters, swapping dimension property for view dimension', () => {
      // given
      filter
        .blankNode()
        .addOut(ns.view.dimension, schema.age)
        .addOut(ns.view.operation, ns.view.Gte)
        .addOut(ns.view.argument, '18')
        .blankNode()
        .addOut(ns.view.dimension, schema.name)
        .addOut(ns.view.operation, ns.view.Eq)
        .addOut(ns.view.argument, 'John')
      dimension.callsFake(({ cubeDimension }) => {
        if (cubeDimension.equals(schema.age)) {
          return { ptr: $rdf.namedNode('dim/age') }
        }

        return { ptr: $rdf.namedNode('dim/name') }
      })

      // when
      populateFilters(view, filter)

      // then
      expect(view.ptr).to.matchShape({
        property: {
          path: ns.view.filter,
          minCount: 2,
          maxCount: 2,
          xone: [{
            node: {
              property: [{
                path: ns.view.dimension,
                hasValue: $rdf.namedNode('dim/age'),
                minCount: 1,
                maxCount: 1,
              }, {
                path: ns.view.operation,
                hasValue: ns.view.Gte,
                minCount: 1,
                maxCount: 1,
              }, {
                path: ns.view.argument,
                hasValue: $rdf.literal('18'),
                minCount: 1,
                maxCount: 1,
              }],
            },
          }, {
            node: {
              property: [{
                path: ns.view.dimension,
                hasValue: $rdf.namedNode('dim/name'),
                minCount: 1,
                maxCount: 1,
              }, {
                path: ns.view.operation,
                hasValue: ns.view.Eq,
                minCount: 1,
                maxCount: 1,
              }, {
                path: ns.view.argument,
                hasValue: $rdf.literal('John'),
                minCount: 1,
                maxCount: 1,
              }],
            },
          }],
        },
      })
    })
  })

  describe('createHydraCollection', () => {
    let templateParams: GraphPointer
    let template: IriTemplate
    let observations: Record<string, Term>[]

    before(() => {
      templateParams = $rdf.clownface()
        .blankNode()
        .addOut(ns.cc.cube, 'CUBE')
        .addOut(ns.cc.cubeGraph, 'GRAPH')
        .addOut(ns.view.view, 'FILTERS')
        .addOut(hydra.limit, $rdf.literal('20', xsd.integer))
      const templatePointer = $rdf.clownface()
        .blankNode()
        .addOut(rdf.type, hydra.IriTemplate)
      template = $rdf.rdfine().factory.createEntity(templatePointer, [], {
        initializer: {
          template: '/observations?cube={cube}&graph={graph}{&view,pageSize}',
          mapping: [{
            property: ns.cc.cube,
            variable: 'cube',
          }, {
            property: ns.cc.cubeGraph,
            variable: 'graph',
          }, {
            property: ns.view.view,
            variable: 'view',
          }, {
            property: hydra.limit,
            variable: 'pageSize',
          }],
        },
      })
      observations = []
    })

    it('creates collection with id template filled with cube and graph', () => {
      // when
      const collection = createHydraCollection({
        templateParams,
        template,
        observations,
        totalItems: 10,
        pageSize: 1,
      })

      // then
      expect(collection.id.value).to.match(/\/observations\?cube=CUBE&graph=GRAPH$/)
    })

    it('creates collection view with id constructed with all template params', () => {
      // when
      const collection = createHydraCollection({
        templateParams,
        template,
        observations,
        totalItems: 10,
        pageSize: 1,
      })

      // then
      expect(collection.view[0].id.value).to.match(/\/observations\?cube=CUBE&graph=GRAPH&view=FILTERS&pageSize=20$/)
    })
  })
})
