import { expect } from 'chai'
import { INSERT, sparql } from '@tpluscode/sparql-builder'
import { turtle, TurtleValue } from '@tpluscode/rdf-string'
import { mdClients } from '@cube-creator/testing/lib'
import { ex } from '@cube-creator/testing/lib/namespace'
import { meta } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { parsers } from '@rdf-esm/formats-common'
import toStream from 'string-to-stream'
import clownface from 'clownface'
import { rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { buildQuery } from '../../../../src/forms/editors/HierarchyPathEditor/query'

describe('@cube-creator/ui/forms/editors/HierarchyPathEditor/query @SPARQL', () => {
  const testDataGraph = $rdf.namedNode('urn:hierarchy:test')

  async function testData (strings: TemplateStringsArray, ...values: TurtleValue[]) {
    const query = sparql`
      DROP SILENT GRAPH ${testDataGraph} ;

      ${INSERT.DATA`GRAPH ${testDataGraph} {
        ${turtle(strings, ...values)}
      }`}
    `.toString()

    await mdClients.streamClient.query.update(query)
  }

  async function parse (strings: TemplateStringsArray, ...values: TurtleValue[]) {
    const graph = turtle(strings, ...values).toString()
    const dataset = await $rdf.dataset().import(parsers.import('text/turtle', toStream(graph))!)
    return clownface({ dataset })
  }

  describe('buildQuery', () => {
    before(async () => {
      await testData`
        <CH> a ${ex.Country} ; ${schema.containedInPlace} <Europe> .

        <ZH> a ${ex.Canton} ; ${schema.containedInPlace} <CH> .

        <Affoltern> a ${ex.District} ;
          ${schema.containedInPlace} <ZH> ;
          ${schema.containsPlace} <Bonstetten> ;
        .

        <Bonstetten> a ${ex.Municipality} .
      `
    })

    it('returns properties for root level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
        .
      `
      const query = buildQuery(hierarchy.namedNode(''))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const result = clownface({ dataset })
      expect(result.node(rdf.type).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns inverse properties for root level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
          ${sh.path} [] ;
        .
      `
      const query = buildQuery(hierarchy.namedNode(''))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const result = clownface({ dataset })
      expect(result.node(schema.containedInPlace).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns inverse properties for deep level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${schema.name} "From continent to Station" ;
          ${sh.path} [
            ${sh.inversePath} ${schema.containedInPlace} ;
          ] ;
          ${meta.nextInHierarchy} [
            ${schema.name} "Canton" ;
            ${sh.path} [
              ${sh.inversePath} ${schema.containedInPlace} ;
            ] ;
            ${meta.nextInHierarchy} [
              ${schema.name} "District" ;
              ${sh.path} [
                ${sh.inversePath} ${schema.containedInPlace} ;
              ] ;
              ${meta.nextInHierarchy} <municipalityLevel>
            ] ;
          ] ;
        .
      `
      const query = buildQuery(hierarchy.namedNode('municipalityLevel'))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const result = clownface({ dataset })
      expect(result.node(schema.containsPlace).out(rdfs.label).terms).to.have.length.gt(0)
    })
  })
})
