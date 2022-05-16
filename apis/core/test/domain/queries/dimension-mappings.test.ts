import { describe, it, beforeEach, afterEach } from 'mocha'
import $rdf from 'rdf-ext'
import { expect } from 'chai'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestDimensions, insertTestProject } from '@cube-creator/testing/lib/seedData'
import { dcterms, prov, schema } from '@tpluscode/rdf-ns-builders/strict'
import { ASK, sparql } from '@tpluscode/sparql-builder'
import { IN, VALUES } from '@tpluscode/sparql-builder/expressions'
import { getUnmappedValues, importMappingsFromSharedDimension } from '../../../lib/domain/queries/dimension-mappings'

describe('@cube-creator/core-api/lib/domain/queries/dimension-mappings @SPARQL', function () {
  this.timeout(20000)

  const pollutantMapping = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd/dimension-mapping/pollutant')

  beforeEach(async () => {
    await insertTestProject()
    await insertTestDimensions()
  })

  describe('getUnmappedValues', () => {
    it('returns combined unmapped values from shapes and observations', async () => {
      // when
      const unmappedValues = await getUnmappedValues(pollutantMapping, ccClients.parsingClient)

      // then
      expect(unmappedValues).to.have.property('size', 3)
      expect([...unmappedValues]).to.have.deep.members([
        $rdf.literal('so2'),
        $rdf.literal('As'),
        $rdf.literal('Pb'),
      ])
    })
  })

  describe('importMappingsFromSharedDimension', () => {
    const testMapping = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/test/dimension-mapping/test')

    afterEach(async () => {
      await ccClients.parsingClient.query.update(sparql`DROP SILENT GRAPH ${testMapping}`.toString())
    })

    it('creates new pairs for matched identifiers', async () => {
      // when
      await importMappingsFromSharedDimension({
        dimensionMapping: pollutantMapping,
        dimension: $rdf.namedNode('http://example.com/dimension/chemicals'),
        predicate: schema.identifier,
      })

      // then
      const sulphurOxidePairCreated = ASK`
          ${pollutantMapping} ${prov.hadDictionaryMember} [
            ${prov.pairKey} "so2" ;
            ${prov.pairEntity} <http://example.com/dimension/chemicals/sulphur-oxide> ;
          ] , [
            ${prov.pairKey} "O3" ;
            ${prov.pairEntity} <http://example.com/dimension/chemicals/ozone> ;
          ] .
        `
        .FROM(pollutantMapping)
        .execute(ccClients.parsingClient.query)
      const ozonePairCreated = ASK`
          ${pollutantMapping} ${prov.hadDictionaryMember} [
            ${prov.pairKey} "so2" ;
            ${prov.pairEntity} <http://example.com/dimension/chemicals/sulphur-oxide> ;
          ] , [
            ${prov.pairKey} "O3" ;
            ${prov.pairEntity} <http://example.com/dimension/chemicals/ozone> ;
          ] .
        `
        .FROM(pollutantMapping)
        .execute(ccClients.parsingClient.query)

      await expect(sulphurOxidePairCreated).to.eventually.be.true
      await expect(ozonePairCreated).to.eventually.be.true
    })

    it('does not create pairs if rdf:predicate does not match', async () => {
      // when
      await importMappingsFromSharedDimension({
        dimensionMapping: pollutantMapping,
        dimension: $rdf.namedNode('http://example.com/dimension/chemicals'),
        predicate: dcterms.identifier,
      })

      // then
      const pairsCreated = await ASK`
          ${pollutantMapping} ${prov.hadDictionaryMember} [
            ${prov.pairKey} ?key ;
            ${prov.pairEntity} <http://example.com/dimension/chemicals/sulphur-oxide> ;
          ] .

          FILTER(?key ${IN('"O3"', '"so2"')})
        `
        .FROM(pollutantMapping)
        .execute(ccClients.parsingClient.query)

      expect(pairsCreated).to.be.false
    })

    it('matches shared terms on string value of literals', async () => {
      // given
      const unmappedValuesGraphPatterns = VALUES(
        { value: '19' },
      )

      // when
      await importMappingsFromSharedDimension({
        dimensionMapping: testMapping,
        dimension: $rdf.namedNode('http://example.com/dimension/cantons'),
        predicate: schema.identifier,
        unmappedValuesGraphPatterns,
      })

      // then
      const pairsCreated = await ASK`
          ${testMapping} ${prov.hadDictionaryMember} [
            ${prov.pairKey} "19" ;
            ${prov.pairEntity} <http://example.com/dimension/canton/ZH> ;
          ] .
        `
        .FROM(testMapping)
        .execute(ccClients.parsingClient.query)

      expect(pairsCreated).to.be.true
    })

    it('matches only valid terms if required', async () => {
      // given
      const unmappedValuesGraphPatterns = VALUES(
        { value: '#00F' },
        { value: '#F00' },
      )

      // when
      await importMappingsFromSharedDimension({
        dimensionMapping: testMapping,
        dimension: $rdf.namedNode('http://example.com/dimension/colors'),
        predicate: schema.identifier,
        unmappedValuesGraphPatterns,
        validThrough: new Date(2021, 5, 20),
      })

      // then
      const blueMapped = await ASK`
          ${testMapping} ${prov.hadDictionaryMember} [
            ${prov.pairKey} "#00F" ;
          ] .
        `
        .FROM(testMapping)
        .execute(ccClients.parsingClient.query)
      const redMapped = await ASK`
          ${testMapping} ${prov.hadDictionaryMember} [
            ${prov.pairKey} "#F00" ;
          ] .
        `
        .FROM(testMapping)
        .execute(ccClients.parsingClient.query)

      expect(blueMapped).to.be.true
      expect(redMapped).to.be.false
    })
  })
})
