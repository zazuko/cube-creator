import { expect } from 'chai'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import $rdf from 'rdf-ext'
import { mdClients } from '@cube-creator/testing/lib/index'
import { md } from '@cube-creator/core/namespace'
import namespace from '@rdfjs/namespace'
import { GraphPointer } from 'clownface'
import { hydra, qb, rdf, rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders/strict'
import { Initializer } from '@tpluscode/rdfine/RdfResource'
import { NodeShape } from '@rdfine/shacl'
import { ex } from '@cube-creator/testing/lib/namespace'
import { ASK, INSERT } from '@tpluscode/sparql-builder'
import { namedNode } from '@cube-creator/testing/clownface'
import Store from '../../lib/store/index'
import { SharedDimensionsStore } from '../../lib/store'

const graph = $rdf.namedNode('https://lindas.admin.ch/cube/dimension')
const ns = namespace('https://ld.admin.ch/cube/dimension/')
const { parsingClient } = mdClients

describe('@cube-creator/shared-dimensions-api/lib/store/index @SPARQL', function () {
  let store: SharedDimensionsStore

  describe('exists', function () {
    before(prepareStore)

    it('returns true when a resource with given type exists in graph', async function () {
      // given
      const id = $rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies')

      // when
      const exists = store.exists(id, md.SharedDimension)

      await expect(exists).to.eventually.be.true
    })

    it('returns false when a resource with given type exists in a different graph', async function () {
      // given
      const id = $rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies')
      await INSERT.DATA`
        GRAPH ${ex.anotherGraph} {
          ${id} a ${md.SharedDimension}
        }
      `.execute(parsingClient.query)

      // when
      const exists = store.exists(id, md.SharedDimension)

      await expect(exists).to.eventually.be.true
    })

    it('returns false when a resource exists in graph but not with the type', async function () {
      // given
      const id = $rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies')

      // when
      const exists = store.exists(id, md.SharedDimensionTerm)

      await expect(exists).to.eventually.be.false
    })

    it('returns false when a resource does no exist', async function () {
      // given
      const id = $rdf.namedNode('https://ld.admin.ch/cube/dimension/foobar')

      // when
      const exists = store.exists(id, md.SharedDimensionTerm)

      await expect(exists).to.eventually.be.false
    })
  })

  describe('load', function () {
    beforeEach(prepareStore)

    before(async function () {
      await INSERT.DATA`
        GRAPH ${ex.otherGraph} {
          ${ns['technologies/sparql']} a ${ex.Something}
        }
      `.execute(parsingClient.query)
    })

    context('existing dimension', function () {
      let dimension: GraphPointer

      before(async function () {
        dimension = await store.load(ns.technologies)
      })

      it('loads base properties', function () {
        expect(dimension).to.matchShape({
          property: [{
            path: rdf.type,
            minCount: 1,
          }, {
            path: schema.name,
            hasValue: $rdf.literal('Technologies', 'en'),
          }, {
            path: schema.validFrom,
            hasValue: $rdf.literal('2021-01-20T23:59:59Z', xsd.dateTime),
          }, {
            path: sh.property,
            minCount: 1,
            nodeKind: sh.BlankNode,
          }],
        })
      })

      it('loads dynamic properties', function () {
        const langStringProperty: Initializer<NodeShape> = {
          property: [{
            path: md.dynamicPropertyType,
            hasValue: 'Lang String',
          }, {
            path: hydra.required,
            hasValue: false,
          }, {
            path: rdfs.label,
            hasValue: 'Help text',
          }, {
            path: rdf.predicate,
            hasValue: rdfs.comment,
          }, {
            path: sh.languageIn,
            minCount: 3,
            maxCount: 3,
          }],
        }
        const literalProperty: Initializer<NodeShape> = {
          property: [{
            path: md.dynamicPropertyType,
            hasValue: 'Literal',
          }, {
            path: hydra.required,
            hasValue: false,
          }, {
            path: rdfs.label,
            hasValue: 'Order',
          }, {
            path: rdf.predicate,
            hasValue: qb.order,
          }, {
            path: sh.datatype,
            hasValue: xsd.integer,
          }],
        }
        const sharedTermProperty: Initializer<NodeShape> = {
          property: [{
            path: md.dynamicPropertyType,
            hasValue: 'Shared Term',
          }, {
            path: hydra.required,
            hasValue: true,
          }, {
            path: rdfs.label,
            hasValue: 'Color',
          }, {
            path: rdf.predicate,
            hasValue: schema.color,
          }, {
            path: sh.class,
            hasValue: $rdf.namedNode('http://example.com/dimension/colors'),
          }],
        }

        expect(dimension).to.matchShape({
          property: [{
            path: schema.additionalProperty,
            nodeKind: sh.BlankNode,
            xone: [
              langStringProperty,
              literalProperty,
              sharedTermProperty,
            ],
          }],
        })
      })
    })

    context('term with dynamic properties', function () {
      let dimensionTerm: GraphPointer

      beforeEach(async function () {
        dimensionTerm = await store.load(ns['technologies/sparql'])
      })

      it('does not load data from other graphs', async function () {
        expect(dimensionTerm).not.to.matchShape({
          property: {
            path: rdf.type,
            hasValue: ex.Something,
          },
        })
      })

      it('gets loaded with common properties', function () {
        expect(dimensionTerm).to.matchShape({
          property: [{
            path: schema.validFrom,
            hasValue: $rdf.literal('2021-01-20T23:59:59Z', xsd.dateTime),
          }, {
            path: schema.identifier,
            hasValue: 'sparql',
          }, {
            path: schema.name,
            hasValue: $rdf.literal('SPARQL', 'en'),
          }, {
            path: schema.inDefinedTermSet,
            hasValue: ns.technologies,
          }, {
            path: rdf.type,
            hasValue: [schema.DefinedTerm, hydra.Resource, md.SharedDimensionTerm],
          }],
        })
      })

      it('gets loaded with dynamic property values', function () {
        expect(dimensionTerm).to.matchShape({
          property: [{
            path: rdfs.comment,
            hasValue: $rdf.literal('This term has dynamic properties', 'en'),
          }, {
            path: qb.order,
            hasValue: 10,
          }, {
            path: schema.color,
            hasValue: ex('dimension/colors/red'),
          }],
        })
      })
    })
  })

  describe('delete', function () {
    beforeEach(prepareStore)

    beforeEach(async function () {
      await INSERT.DATA`
        GRAPH ${ex.otherGraph} {
          ${ns['technologies/sparql']} a ${ex.Something}
        }
      `.execute(parsingClient.query)
    })

    it('does not delete data from other graphs', async function () {
      // given
      const term = ns['technologies/sparql']

      // when
      await store.delete(term)

      // then
      await expect(ASK`${term} ?p ?o`.FROM(ex.otherGraph).execute(parsingClient.query)).to.eventually.be.true
    })

    it('deletes dimension term with dynamic properties', async function () {
      // given
      const term = ns['technologies/sparql']

      // when
      await store.delete(term)

      // then
      await expect(ASK`${term} ?p ?o`.FROM(graph).execute(parsingClient.query)).to.eventually.be.false
    })

    it('deletes dimension deep', async function () {
      // given
      const term = ns.technologies

      // when
      await store.delete(term)

      // then
      await expect(ASK`${term} (<>|!<>)+ ?o`.execute(parsingClient.query)).to.eventually.be.false
    })
  })

  describe('save', function () {
    before(prepareStore)

    it('inserts new resource', async function () {
      // given
      const term = namedNode(ns['technologies/owl'])
        .addOut(rdf.type, [md.SharedDimensionTerm, hydra.Resource, schema.DefinedTerm])
        .addOut(schema.identifier, 'owl')
        .addOut(schema.name, $rdf.literal('OWL', 'de'))
        .addOut(schema.inDefinedTermSet, ns.technologies)

      // when
      await store.save(term)

      // then
      await expect(ASK`
        ${ns['technologies/owl']}
          a ${schema.DefinedTerm}, ${hydra.Resource}, ${md.SharedDimensionTerm} ;
          ${schema.identifier} "owl" ;
          ${schema.name} "OWL"@de ;
          ${schema.inDefinedTermSet} ${ns.technologies} ;
        .
      `.execute(parsingClient.query)).to.eventually.be.true
    })

    it('updates existing resource', async function () {
      // given
      const term = namedNode(ns['technologies/rdf'])
        .addOut(rdf.type, [md.SharedDimensionTerm, hydra.Resource, schema.DefinedTerm])
        .addOut(schema.identifier, 'rdf')
        .addOut(schema.name, $rdf.literal('RDF', 'de'))
        .addOut(schema.inDefinedTermSet, ns.technologies)

      // when
      await store.save(term)

      // then
      await expect(ASK`
        ${ns['technologies/rdf']}
          a ${schema.DefinedTerm}, ${hydra.Resource}, ${md.SharedDimensionTerm} ;
          ${schema.identifier} "rdf" ;
          ${schema.name} "RDF"@de ;
          ${schema.inDefinedTermSet} ${ns.technologies} ;
        .
      `.execute(parsingClient.query)).to.eventually.be.true
      await expect(ASK`
        ${ns['technologies/rdf']} ${schema.validThrough} ?validThrough .
      `.execute(parsingClient.query)).to.eventually.be.false
    })

    it('updates dynamic properties', async function () {
      // given
      const term = namedNode(ns['technologies/sparql'])
        .addOut(rdf.type, [md.SharedDimensionTerm, hydra.Resource, schema.DefinedTerm])
        .addOut(schema.identifier, 'sparql')
        .addOut(schema.name, $rdf.literal('SPARQL', 'en'))
        .addOut(schema.inDefinedTermSet, ns.technologies)
        .addOut(schema.color, ex('dimensions/colors/blue'))
        .addOut(qb.order, 20)
        .addOut(rdfs.comment, 'Updated')

      // when
      await store.save(term)

      // then
      await expect(ASK`
        ${ns['technologies/sparql']}
          ${schema.color} ${ex('dimensions/colors/red')} ;
          ${qb.order} 10 ;
          ${rdfs.comment} "This term has dynamic properties" .
      `.execute(parsingClient.query)).to.eventually.be.false
      await expect(ASK`
        ${ns['technologies/sparql']}
          ${schema.color} ${ex('dimensions/colors/blue')} ;
          ${qb.order} 20 ;
          ${rdfs.comment} "Updated" .
      `.execute(parsingClient.query)).to.eventually.be.true
    })
  })

  async function prepareStore() {
    store = new Store(parsingClient, graph)
    await insertTestDimensions()
  }
})
