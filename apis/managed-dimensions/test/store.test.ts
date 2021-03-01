import { describe, it, before, beforeEach } from 'mocha'
import { namedNode } from '@cube-creator/testing/clownface'
import { mdClients } from '@cube-creator/testing/lib'
import { foaf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { ASK, INSERT } from '@tpluscode/sparql-builder'
import { expect } from 'chai'
import Store, { ManagedDimensionsStore } from '../lib/store'
import $rdf from 'rdf-ext'
import { ex } from '@cube-creator/testing/lib/namespace'

const { parsingClient } = mdClients

describe('@cube-creator/managed-dimensions-api/lib/store @SPARQL', () => {
  const graph = $rdf.namedNode('http://test.graph/store')
  let store: ManagedDimensionsStore

  before(() => {
    store = new Store(parsingClient, graph)
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
          ${resource.term} ${sh.node} ?shape .

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
          ${resource.term} ${sh.node} ?shape .

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
            ${resource.term} ${sh.node} ?shape .

            ?shape ${sh.property} [ ${sh.path} ${schema.knows} ; ${sh.node} ?childShape ] .
          `.FROM(graph)
        expect(await testQuery.execute(parsingClient.query)).to.be.false
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
            ${sh.node} [
              ${sh.property} [
                ${sh.path} ${schema.name} ;
              ] ;
            ] ;
          .
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
  })
})
