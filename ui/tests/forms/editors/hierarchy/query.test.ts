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
import { gn, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders/strict'
import { properties, types } from '../../../../src/forms/editors/hierarchy/query'

describe('@cube-creator/ui/forms/editors/hierarchy/query @SPARQL', () => {
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

  before(async () => {
    await testData`
      <CH> a ${ex.Country} ; ${schema.containedInPlace} <Europe> .

      <https://sws.geonames.org/2658434>
        a ${gn.Feature} ; ${gn.parentFeature} <Europe> .

      <ZH> a ${ex.Canton} ; ${schema.containedInPlace} <CH> .

      <Affoltern> a ${ex.District} ;
        ${schema.containedInPlace} <ZH> ;
        ${schema.containsPlace} <Bonstetten> ;
      .

      <Bonstetten> a ${ex.Municipality} .
    `
  })

  describe('properties', () => {
    it('returns properties for first level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
      `
      const query = properties(hierarchy.namedNode('firstLevel'))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const result = clownface({ dataset })
      expect(result.node(rdf.type).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('filters by resources at level by sh:targetClass', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .

        <firstLevel> ${sh.targetClass} ${gn.Feature} ; ${sh.path} [] .
      `
      const query = properties(hierarchy.namedNode('firstLevel'))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const results = clownface({ dataset })
        .has(rdfs.label)
        .terms
      expect(results).to.have.length(1)
      expect(results).to.deep.contain.members([
        gn.parentFeature
      ])
    })

    it('returns inverse properties for first level', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <CH> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .

        <firstLevel> ${sh.path} [] .
      `
      const query = properties(hierarchy.namedNode('firstLevel'))

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
          ${meta.nextInHierarchy} [
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
          ]
        .
      `
      const query = properties(hierarchy.namedNode('municipalityLevel'))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const result = clownface({ dataset })
      expect(result.node(schema.containsPlace).out(rdfs.label).terms).to.have.length.gt(0)
    })

    it('returns empty string if an intermediate path is invalid', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${schema.name} "From continent to Station" ;
          ${meta.nextInHierarchy} [
            ${sh.path} [
              ${sh.inversePath} ${schema.containedInPlace} ;
            ] ;
            ${meta.nextInHierarchy} [
              ${schema.name} "Canton" ;
              ${sh.path} [
              ] ;
              ${meta.nextInHierarchy} [
                ${schema.name} "District" ;
                ${sh.path} [
                  ${sh.inversePath} ${schema.containedInPlace} ;
                ] ;
                ${meta.nextInHierarchy} <municipalityLevel>
              ] ;
            ] ;
          ]
        .
      `
      // when
      const query = properties(hierarchy.namedNode('municipalityLevel'))

      // then
      expect(query).to.be.empty
    })
  })

  describe('types', () => {
    it('returns types of resources in specific level in hierarchy', async () => {
      // given
      const hierarchy = await parse`
        <>
          ${meta.hierarchyRoot} <Europe> ;
          ${meta.nextInHierarchy} <firstLevel> ;
        .
        <firstLevel> ${sh.path} [] .
      `
      const query = types(hierarchy.namedNode('firstLevel'))

      // when
      const dataset = $rdf.dataset(await mdClients.parsingClient.query.construct(query))

      // then
      const result = clownface({ dataset })
      expect(result.has(rdfs.label).terms).to.deep.contain.members([
        gn.Feature,
        ex.Country
      ])
    })
  })
})
