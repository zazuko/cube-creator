import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { dcat, dcterms, qudt, schema, sh, time, vcard, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import env from '@cube-creator/core/env'
import { insertTestProject, insertPxCube } from '@cube-creator/testing/lib/seedData'
import { ASK, SELECT } from '@tpluscode/sparql-builder'
import * as ns from '@cube-creator/core/namespace'
import { ccClients } from '@cube-creator/testing/lib'
import { setupEnv } from '../../support/env'
import runner from '../../../lib/commands/import'
import { cc, meta } from '@cube-creator/core/namespace'

describe('@cube-creator/cli/lib/commands/import', function () {
  this.timeout(200000)

  const cube = $rdf.namedNode('http://example.org/px-cube')
  const cubeNs = namespace(`${cube.value}/`)
  const resource = namespace(env.API_CORE_BASE)
  const cubeDataGraph = resource('cube-project/px/cube-data')

  before(async () => {
    setupEnv()
    await insertTestProject()
    await insertPxCube()
    await runner({
      debug: true,
      job: `${env.API_CORE_BASE}cube-project/px/jobs/import-job`,
    })
  })

  it('copies all observations', async () => {
    const [result] = await SELECT`( COUNT (DISTINCT ?observation) as ?count )`
      .FROM(cubeDataGraph)
      .WHERE`
          ${cube} a ${ns.cube.Cube} ; ${ns.cube.observationSet} ?set .

          ?set ${ns.cube.observation} ?observation .
          ?observation ?p ?o .
        `.execute(ccClients.parsingClient.query)

    expect(result.count).to.deep.eq($rdf.literal('14256', xsd.integer))
  })

  it('copies observation constraint shape', async () => {
    const hasName = await ASK`
        ${cube} a ${ns.cube.Cube} .
        ${cube} ${ns.cube.observationConstraint} ?shape .

        ?shape ${ns.cube.observation} [
          ${sh.path} ?path ;
        ] .
      `
      .FROM(cubeDataGraph)
      .execute(ccClients.parsingClient.query)

    expect(hasName).to.be.false
  })

  it('does not copy cube metadata into data graph', async () => {
    const hasName = await ASK`${cube} ${schema.name} ?name`
      .FROM(cubeDataGraph)
      .execute(ccClients.parsingClient.query)

    expect(hasName).to.be.false
  })

  it('copies observation concept data into data grap', async () => {
    const hasConceptData = await ASK`
        ?observation ${cubeNs('dimension/0')} ?concept .
        ?concept ${schema.name} ?name
      `
      .FROM(cubeDataGraph)
      .execute(ccClients.parsingClient.query)

    expect(hasConceptData).to.be.true
  })

  it('initializes dimension metadata collection', async () => {
    const metadata = resource('cube-project/px/dataset/dimension-metadata')
    const [dimensions] = await SELECT`( COUNT(?dim) as ?count )`
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .WHERE`
          ${metadata} ${schema.hasPart} ?dimensionMetadata ; a ${cc.DimensionMetadataCollection} .
          ?dimensionMetadata ${schema.about} ?dim .
        `
      .execute(ccClients.parsingClient.query)

    expect(dimensions.count).to.deep.eq($rdf.literal('20', xsd.integer))
  })

  it('copies cube metadata without deleting existing data', async () => {
    const hasPreviousData = await ASK`
        ?dataset a ${schema.Dataset} ;
                   ${schema.hasPart} ${cube} ;
                   ${cc.dimensionMetadata} ?metadata .

        ${cube} ${dcterms.creator} ${resource('user')}
      `
      .FROM(resource('cube-project/px/dataset'))
      .execute(ccClients.parsingClient.query)

    const hasNewMeta = await ASK`
        ${resource('cube-project/px/dataset')}
          ${schema.identifier} ?id ;
          ${schema.name} ?name ;
          ${schema.comment} ?comment ;
          ${schema.description} ?desc ;
          ${schema.temporalCoverage} ?temp ;
        .
      `.FROM(resource('cube-project/px/dataset'))
      .execute(ccClients.parsingClient.query)

    expect(hasNewMeta).to.be.true
    expect(hasPreviousData).to.be.true
  })

  it('does not copy observation URIs into meta graph', async () => {
    const hasObservations = ASK`?set ${ns.cube.observation} ?observation`
      .FROM(resource('cube-project/px/dataset'))
      .execute(ccClients.parsingClient.query)

    await expect(hasObservations).to.eventually.be.false
  })

  it('copies dimension metadata', async () => {
    const hasDimensionMeta = await ASK`
        ?collection a ${cc.DimensionMetadataCollection} ;
                    ${schema.hasPart} ?meta .
        ?meta ${schema.about} ${cubeNs('measure/12')} ;
              ${schema.name} "Bois de grumes en m3"@fr ;
              ${qudt.scaleType} ${qudt.RatioScale} .
      `.FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    expect(hasDimensionMeta).to.be.true
  })

  it('keeps existing metadata properties', async () => {
    const hasDescription = await ASK`
          ?meta ${schema.about} ${cubeNs('measure/5')} ;
                ${schema.description} ?desc .
        `
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    expect(hasDescription).to.be.true
  })

  it('skips dimension metadata properties which are already set', async () => {
    const didNotReplace = await ASK`
          ?meta ${schema.about} ${cubeNs('measure/5')} ;
                ${qudt.scaleType} ${qudt.EnumerationScale}
        `
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    expect(didNotReplace).to.be.true
  })

  it('skips dimension metadata literal properties which are already set in given language', async () => {
    const [result, ...rest] = await SELECT`?name`
      .WHERE`
          ?meta ${schema.about} ${cubeNs('measure/5')} ;
                ${schema.name} ?name .

          FILTER (
            "de" = lang(?name)
          )
        `
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    expect(result.name.value).to.eq('Bundeswaelder in ha')
    expect(rest).to.have.length(0)
  })

  it('removes superfluous dimension metadata', async () => {
    const hasRemovedPart = await ASK`
        ?collection a ${ns.cc.DimensionMetadataCollection} ;
                    ${schema.hasPart} ${resource('cube-project/px/dataset/dimension-metadata/remove')}
      `
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    const hasRemovedDimension = await ASK`
        ?meta ${schema.about} ${cubeNs('measure/remove')}
      `
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    expect(hasRemovedPart).to.be.false
    expect(hasRemovedDimension).to.be.false
  })

  it('keeps deep dimension metadata', async () => {
    const didNotRemove = await ASK`
          ?meta ${schema.about} ${cubeNs('measure/5')} ;
                ${meta.dataKind} [
                  a ${time.GeneralDateTimeDescription} ;
                  ${time.unitType} ${time.unitHour} ;
                ] ;
        `
      .FROM(resource('cube-project/px/dataset/dimension-metadata'))
      .execute(ccClients.parsingClient.query)

    expect(didNotRemove).to.be.true
  })

  it('keeps existing cube metadata', async () => {
    const keptExistingMeta = await ASK`
      ?dataset ${schema.hasPart} ${cube} ;
               ${schema.description} ?description ;
               ${dcat.contactPoint} [
                 ${vcard.fn} ?fn ;
                 ${vcard.hasEmail} ?email ;
               ] .

      filter (
        lang(?description) = "en"
      )
    `
      .FROM(resource('cube-project/px/dataset'))
      .execute(ccClients.parsingClient.query)

    expect(keptExistingMeta).to.be.true
  })

  it('keeps existing cube metadata literals, imports new languages', async () => {
    const results = await SELECT`?unitText`
      .WHERE`
      ?dataset ${schema.hasPart} ${cube} ;
               ${schema.unitText} ?unitText ;
      .
    `
      .FROM(resource('cube-project/px/dataset'))
      .execute(ccClients.parsingClient.query)
    const literals = results.map((row) => row.unitText)

    expect(literals).to.have.length(3)
    expect(literals).to.deep.contain.members([
      $rdf.literal('Anzahl (ha, m3)', 'de'),
      $rdf.literal('Count, ha, m3', 'en'),
      $rdf.literal('Nombre, ha, m3', 'fr'),
    ])
  })
})
