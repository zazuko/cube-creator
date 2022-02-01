import { describe, it, before, beforeEach } from 'mocha'
import { namedNode } from '@cube-creator/testing/clownface'
import { mdClients } from '@cube-creator/testing/lib'
import { foaf, schema, sh, rdfs } from '@tpluscode/rdf-ns-builders'
import { ASK, INSERT, SELECT } from '@tpluscode/sparql-builder'
import { expect } from 'chai'
import Store, { SharedDimensionsStore } from '../lib/store'
import $rdf from 'rdf-ext'
import { ex } from '@cube-creator/testing/lib/namespace'
import { Term } from 'rdf-js'
import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'

const { parsingClient } = mdClients

describe('@cube-creator/shared-dimensions-api/lib/store @SPARQL', () => {
  const graph = $rdf.namedNode('http://test.graph/store')
  let store: SharedDimensionsStore

  before(async () => {
    store = new Store(parsingClient, graph)
    await insertTestDimensions()
  })

  beforeEach(async () => {
    await parsingClient.query.update(`DROP SILENT GRAPH <${graph}>`)
  })

  describe('save', () => {
    describe('extracts shape @SPARQL', () => {
      it('which represents that resource', async () => {
        // given
        const resource = namedNode('http://test.resource/john')
          .addOut(schema.name, 'John Doe')
          .addOut(schema.knows, $rdf.namedNode('http://test.resource/jane'), friend => {
            friend.addOut(schema.name, 'Jane')
            friend.addOut(schema.age, 20)
          })
          .addOut(schema.knows, $rdf.namedNode('http://test.resource/howard'), friend => {
            friend.addOut(foaf.name, 'Howard')
            friend.addOut(foaf.age, 20)
            friend.addOut(schema.alumniOf, $rdf.namedNode('http://test.resource/ucla'), ucla => {
              ucla.addOut(schema.name, 'University of California Los Angeles')
            })
          })

        // when
        await store.save(resource)

        // then
        expect(await ASK`
          ?shape ${sh.targetNode} ${resource.term} .

          ?shape ${sh.property} [ ${sh.path} ${schema.name} ].
          ?shape ${sh.property} [
            ${sh.path} ${schema.knows} ;
            ${sh.node} [
              ${sh.property} [ ${sh.path} ${schema.age} ] ;
            ] ;
          ].

        `.FROM(graph).execute(parsingClient.query)).to.be.true
      })

      it('handles cycles @SPARQL', async () => {
        // given
        const resource = namedNode('http://test.resource/test')
        resource.addOut(schema.knows, resource)

        // when
        await store.save(resource)

        // then
        expect(await ASK`
          ?shape ${sh.targetNode} ${resource.term} .

          ?shape ${sh.property} [ ${sh.path} ${schema.knows} ] .

        `.FROM(graph).execute(parsingClient.query)).to.be.true
      })

      it('does not extract shape of children without predicates @SPARQL', async () => {
        // given
        const resource = namedNode('http://test.resource/john')
          .addOut(schema.knows, $rdf.namedNode('http://test.resource/jane'))

        // when
        await store.save(resource)

        // then
        const testQuery = ASK`
            ?shape ${sh.targetNode} ${resource.term} .

            ?shape ${sh.property} [ ${sh.path} ${schema.knows} ; ${sh.node} ?childShape ] .
          `.FROM(graph)
        expect(await testQuery.execute(parsingClient.query)).to.be.false
      })

      it('produces only one Property Shape for property with multiple literal objects', async () => {
        // given
        const resource = namedNode('http://test.resource/john')
          .addOut(schema.identifier, ['Foo', 'Bar', 'Baz', $rdf.blankNode()])

        // when
        await store.save(resource)

        // then
        const [{ count }] = await SELECT`(count ( ?ps ) as ?count)`.WHERE`
          [
            ${sh.targetNode} ${resource.term} ;
            ${sh.property} ?ps
          ].

          ?ps ${sh.path} ${schema.identifier} .
        `
          .FROM(graph)
          .execute(parsingClient.query)
        expect(count.value).to.eq('2')
      })

      it('produces a separate Property Shape for every resource object', async () => {
        // given
        const mike = $rdf.namedNode('http://test.resource/mike')
        const sam = $rdf.namedNode('http://test.resource/sam')
        const resource = namedNode('http://test.resource/john')
          .addOut(schema.children, mike, mike => mike.addOut(schema.name, 'Mike'))
          .addOut(schema.children, sam, sam => sam.addOut(schema.name, 'Sam').addOut(schema.age, 20))

        // when
        await store.save(resource)

        // then
        const hasChildProp = (child: Term, childProp: Term) => ASK`
          [
            ${sh.targetNode} ${resource.term} ;
            ${sh.property} [
              ${sh.path} ${schema.children} ;
              ${sh.node} [
                ${sh.targetNode} ${child} ;
                ${sh.property} ${childProp} ;
              ] ;
            ] ;
          ] .
        `
          .FROM(graph)
          .execute(parsingClient.query)
        expect(hasChildProp(mike, schema.name)).to.eventually.be.true
        expect(hasChildProp(mike, schema.age)).to.eventually.be.false
        expect(hasChildProp(sam, schema.name)).to.eventually.be.true
        expect(hasChildProp(sam, schema.age)).to.eventually.be.true
      })
    })
  })

  describe('delete', () => {
    it('deletes triples complete with shape but leaves superfluous data', async () => {
      // given
      await INSERT.DATA`
        graph ${graph} {
          ${ex.toDelete}
            ${schema.name} "Yes" ;
            ${ex.hidden} "foo" ;
          .

          [
            ${sh.targetNode} ${ex.toDelete} ;
            ${sh.property} [
              ${sh.path} ${schema.name} ;
            ] ;
          ] .
        }`.execute(parsingClient.query)

      // when
      await store.delete(ex.toDelete)

      // then
      expect(await ASK`
        ${ex.toDelete} ?p ?o .

        MINUS {
          ${ex.toDelete} ${ex.hidden} ?o .
        }
      `.FROM(graph).execute(parsingClient.query)).to.be.false
      expect(await ASK`${ex.toDelete} ${ex.hidden} ?stillThere`.FROM(graph).execute(parsingClient.query)).to.be.true
    })

    it('does not delete triples describe by other, non root shapes', async () => {
      // given
      await INSERT.DATA`
        graph ${graph} {
          ${ex.toDelete}
            ${schema.name} "Yes" ;
            ${ex.external} "foo" ;
          .

          [
            ${sh.targetNode} ${ex.toDelete} ;
            ${sh.property} [
              ${sh.path} ${schema.name} ;
            ] ;
          ] .

          [
            ${sh.targetNode} ${ex.Foo} ;
            ${sh.property} [
              ${sh.path} ${ex.foo} ;
              ${sh.node} [
                ${sh.targetNode} ${ex.toDelete} ;
                ${sh.property} [
                  ${sh.path} ${ex.external} ;
                ] ;
              ] ;
            ] ;
          ] .
        }`.execute(parsingClient.query)

      // when
      await store.delete(ex.toDelete)

      // then
      expect(await ASK`${ex.toDelete} ${ex.external} ?stillThere`.FROM(graph).execute(parsingClient.query)).to.be.true
    })

    it('deeply deletes the shape describing deleted resource', async () => {
      // given
      await INSERT.DATA`
        graph ${graph} {
          ${ex.toDelete}
            ${schema.knows} ${ex.friend} .
          ${ex.friend} ${schema.age} 20 .

          ${ex.rootShape}
            ${sh.targetNode} ${ex.toDelete} ;
            ${sh.property} ${ex.knowsShape} .
          ${ex.knowsShape}
             ${sh.path} ${schema.knows} ;
             ${sh.node} ${ex.friendShape} .
          ${ex.friendShape}
            ${sh.targetNode} ${ex.friend} ;
            ${sh.property} ${ex.ageShape} .
          ${ex.ageShape}
            ${sh.path} ${schema.age} .
        }`.execute(parsingClient.query)

      // when
      await store.delete(ex.toDelete)

      // then
      await expect(SELECT`*`.FROM(graph).WHERE`?s ?p ?o`.execute(parsingClient.query)).to.eventually.have.length(0)
    })
  })

  describe('get', () => {
    it('retrieves resource from deep shape', async () => {
      // given
      store = new Store(parsingClient, $rdf.namedNode('https://lindas.admin.ch/cube/dimension'))

      // when
      const dimension = await store.load($rdf.namedNode('https://ld.admin.ch/cube/dimension/technologies'))

      // then
      expect(dimension).to.matchShape({
        property: {
          path: schema.additionalProperty,
          node: {
            property: {
              path: rdfs.label,
              minCount: 1,
            },
          },
        },
      })
    })
  })
})
