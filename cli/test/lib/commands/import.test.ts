import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { dcterms, qudt, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import env from '@cube-creator/core/env'
import { insertTestProject, insertPxCube } from '@cube-creator/testing/lib/seedData'
import { ASK, SELECT } from '@tpluscode/sparql-builder'
import * as ns from '@cube-creator/core/namespace'
import { ccClients } from '@cube-creator/testing/lib'
import { setupEnv } from '../../support/env'
import runner from '../../../lib/commands/import'
import { cc } from '@cube-creator/core/namespace'

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
  })

  describe('first run', () => {
    before(async () => {
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

    it('does not copy dimension metadata into data graph', async () => {
      const hasName = await ASK`${cubeNs('dimension/2/5')} ${schema.name} ?name`
        .FROM(cubeDataGraph)
        .execute(ccClients.parsingClient.query)

      expect(hasName).to.be.false
    })

    it('initializes dimension metadata collection', async () => {
      const metadata = resource('cube-project/px/dimensions-metadata')
      const [dimensions] = await SELECT`( COUNT(?dim) as ?count )`
        .FROM(resource('cube-project/px/dimensions-metadata'))
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
        ${cube} ${schema.identifier} ?id ;
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
  })
})
