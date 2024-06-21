import env from '@cube-creator/core/env/node'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from '@cube-creator/env'
import { ASK, DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import { csvw, rdf, rdfs, schema, sh, unit, xsd } from '@tpluscode/rdf-ns-builders'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { cc, cube } from '@cube-creator/core/namespace'
import { setupEnv } from '../../support/env.js'
import runner from '../../../lib/commands/transform.js'

describe('@cube-creator/cli/lib/commands/transform', function () {
  this.timeout(360 * 1000)

  const executionUrl = 'http://example.com/transformation-test'

  before(async () => {
    setupEnv()
    await insertTestProject()
  })

  describe('successful job', () => {
    const projectNs = $rdf.namespace(`${env.API_CORE_BASE}cube-project/ubd/`)
    const job = `${projectNs().value}csv-mapping/jobs/test-job`
    const expectedGraph = projectNs('cube-data')
    const cubeBase = 'https://environment.ld.admin.ch/foen/ubd/28/'
    const cubeNs = $rdf.namespace(cubeBase)
    const cubeShape = cubeNs('shape/')

    before(async () => {
      // when
      await runner({
        to: 'graph-store',
        debug: true,
        job,
        executionUrl,
      })
    })

    it('produces constraint shape', async () => {
      const shape = await ASK`?shape a ${sh.NodeShape}`.FROM(expectedGraph).execute(ccClients.streamClient)

      expect(shape).to.be.true
    })

    it('removes previous errors from dataset', async () => {
      const datasetGraph = projectNs.dataset

      const hasPreviousErrors = ASK`
        <dataset> schema:error <dataset#non-unique-observations> .
        <dataset> schema:error <dataset#missing-values-error> ; ${schema.description} "Test message" .
      `
        .FROM(datasetGraph)
        .prologue`BASE ${projectNs()}`
        .execute(ccClients.parsingClient)

      await expect(hasPreviousErrors).to.eventually.be.false
    })

    it('adds no sh:in to large dimension', async () => {
      const hasInList = ASK`
          ${cubeShape} ${sh.property} ?property .
          ?property ${sh.path} ${cubeNs.station} .
          ?property ${sh.in} ?in
        `
        .FROM(expectedGraph)
        .execute(ccClients.parsingClient)

      await expect(hasInList).to.eventually.be.false
    })

    it('does not add sh:in for dimension of literals', async () => {
      const hasInList = ASK`
          ${cubeShape} ${sh.property} ?property .
          ?property ${sh.path} ${cubeNs('dimension/limitvalue')} .
          ?property ${sh.in} ?in
        `
        .FROM(expectedGraph)
        .execute(ccClients.parsingClient)

      expect(hasInList).eventually.be.false
    })

    it('produces observations', async () => {
      const query = DESCRIBE`${cubeNs('observation/so2-blBAS-2000-annualmean')}`.FROM(expectedGraph)
      const dataset = await $rdf.dataset().import(await query.execute(ccClients.streamClient))

      const observation = $rdf.clownface({ dataset }).node(cubeNs('observation/so2-blBAS-2000-annualmean'))

      expect(observation).to.matchShape({
        property: [{
          path: rdf.type,
          hasValue: cube.Observation,
          minCount: 1,
        }, {
          path: cube.observedBy,
          minCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/year'),
          hasValue: $rdf.literal('2000', xsd.gYear),
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/value'),
          hasValue: $rdf.literal('4.7', xsd.decimal),
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/station'),
          hasValue: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/station/blBAS'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/canton'),
          hasValue: cube.Undefined,
          minCount: 1,
          maxCount: 1,
        }, {
          path: rdfs.comment,
          hasValue: $rdf.literal('', cube.Undefined),
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/aggregation'),
          hasValue: 'annualmean',
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/limitvalue'),
          hasValue: 30,
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/pollutant'),
          hasValue: 'so2',
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/unit'),
          hasValue: unit['MicroGM-PER-M3'],
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('produces non-observation resources', async () => {
      const query = DESCRIBE`${cubeNs('station/blBAS')}`.FROM(expectedGraph)
      const dataset = await $rdf.dataset().import(await query.execute(ccClients.streamClient))

      const station = $rdf.clownface({ dataset }).node(cubeNs('station/blBAS'))

      expect(station).to.matchShape({
        property: [{
          path: schema.identifier,
          hasValue: 'blBAS',
          minCount: 1,
          maxCount: 1,
        }, {
          path: schema.name,
          minCount: 1,
        }],
      })
    })

    it('does not output cc:cube as dimension property', async () => {
      const hasCubeProperty = await ASK`${cubeShape} ${sh.property}/${sh.path} ${cc.cube} .`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .execute(ccClients.streamClient)
      expect(hasCubeProperty).to.eq(false)
    })

    it('does not output csvw:describes as dimension property', async () => {
      const hasDescribesProperty = await ASK`${cubeShape} ${sh.property}/${sh.path} ${csvw.describes} .`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .execute(ccClients.streamClient)

      expect(hasDescribesProperty).to.eq(false)
    })

    it('all observations are named nodes', async () => {
      const hasDescribesProperty = await ASK`
        ?observation a ${cube.Observation} .

        FILTER ( BNODE (?observation) )
      `
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .execute(ccClients.streamClient)

      expect(hasDescribesProperty).to.eq(false)
    })

    it('removes all CSVW triples but csvw:describes', async () => {
      const distinctCsvwProps = await SELECT.DISTINCT`?prop`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .WHERE`
          ?s ?prop ?o .
          filter (regex(str(?prop), str(${csvw()})))
        `
        .execute(ccClients.parsingClient)

      expect(distinctCsvwProps).to.have.length(1)
      expect(distinctCsvwProps[0].prop).to.deep.eq(csvw.describes)
    })

    it('updates job', async () => {
      const { representation } = await $rdf.hydra.loadResource(job)
      expect(representation?.root).to.matchShape({
        property: [{
          path: schema.actionStatus,
          hasValue: schema.CompletedActionStatus,
          minCount: 1,
          maxCount: 1,
        }, {
          path: rdfs.seeAlso,
          minCount: 1,
          nodeKind: sh.IRI,
        }],
      })
    })

    it('outputs ""^^cube:Undefined for missing literal dimension values', async () => {
      const observationValue = await SELECT`?value`
        .FROM(expectedGraph)
        .WHERE`
          <https://environment.ld.admin.ch/foen/ubd/28/observation/so2-blBAS-2000-annualmean> ${rdfs.comment} ?value
        `.execute(ccClients.parsingClient)

      expect(observationValue[0]?.value).to.deep.eq($rdf.literal('', cube.Undefined))
    })

    it('does not output ""^^cube:Undefined for non-Observation tables', async () => {
      const hasName = await ASK`${cubeNs('station/neCHA')} ${schema.name} ?name`
        .FROM(expectedGraph)
        .execute(ccClients.parsingClient)

      expect(hasName).to.be.false
    })

    it('outputs cube:Undefined for missing value mapped to a shared dimension', async () => {
      const result = await SELECT`?value`
        .FROM(expectedGraph)
        .WHERE`
          <https://environment.ld.admin.ch/foen/ubd/28/observation/so2-blBAS-1984-annualmean> <https://environment.ld.admin.ch/foen/ubd/28/unit> ?value
        `.execute(ccClients.parsingClient)

      expect(result[0]?.value).to.deep.eq(cube.Undefined)
    })

    it('includes ""^^cube:Undefined in property shape sh:in of literal columns', async () => {
      const dataset = await $rdf.dataset().import(DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} ${rdfs.comment} .
        `
        .execute(ccClients.streamClient, { base: cubeBase }))

      const ins = [...$rdf.clownface({ dataset }).has(sh.in).out(sh.in).list()!].map(ptr => ptr.term)

      expect(ins).to.deep.contain.members([$rdf.literal('', cube.Undefined)])
    })

    it('does not emit sh:in for min/max dimensions', async () => {
      const dataset = await $rdf.dataset().import(DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} ${cubeNs('dimension/value')} .
        `
        .execute(ccClients.streamClient, { base: cubeBase }))

      const propShape = $rdf.clownface({ dataset }).has(sh.path)

      expect(propShape.has(sh.in).terms).to.have.length(0)
      expect(propShape.has(sh.minInclusive).terms).to.have.length(1)
      expect(propShape.has(sh.maxInclusive).terms).to.have.length(1)
    })

    it('includes cube:Undefined in property shape sh:in of mapped columns', async () => {
      const dataset = await $rdf.dataset().import(DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} <unit> .
        `
        .execute(ccClients.streamClient, { base: cubeBase }))

      const ins = [...$rdf.clownface({ dataset }).has(sh.in).out(sh.in).list()!].map(ptr => ptr.term)

      expect(ins).to.deep.contain.members([cube.Undefined])
    })

    it('emits an sh:or alternative to include cube:Undefined datatype', async () => {
      const dataset = await $rdf.dataset().import(DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} ${rdfs.comment} .
        `
        .execute(ccClients.streamClient, { base: cubeBase }))

      const ors = [...$rdf.clownface({ dataset }).has(sh.or).out(sh.or).list()!]
        .flatMap(ptr => ptr.out(sh.datatype).terms)

      expect(ors).to.have.length(2)
      expect(ors).to.deep.contain.members([xsd.string, cube.Undefined])
    })

    it('keeps original values of shared dimension mappings around', async function () {
      const originalValues = await SELECT`?s ?p ?o`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .WHERE`
          ?s ?p ?o .
          ?p a ${cc.OriginalValuePredicate} .
        `
        .execute(ccClients.parsingClient)

      expect(originalValues).to.have.length(28999)
      expect(originalValues[0].p).to.deep.eq($rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/pollutant#_original'))
      expect(originalValues[0].o).to.deep.eq($rdf.literal('co'))
    })
  })

  it('updates job when pipeline has errors', async function () {
    // given
    const jobUri = `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/broken-job`

    // when
    const jobRun = runner({
      to: 'graph-store',
      debug: true,
      job: jobUri,
      executionUrl,
    })
    await expect(jobRun).to.have.rejected

    // then
    const job = await $rdf.hydra.loadResource(jobUri)
    expect(job.representation?.root).to.matchShape({
      property: [{
        path: schema.actionStatus,
        hasValue: schema.FailedActionStatus,
        minCount: 1,
        maxCount: 1,
      }, {
        path: rdfs.seeAlso,
        minCount: 1,
        nodeKind: sh.IRI,
      }, {
        path: schema.error,
        node: {
          property: {
            path: schema.description,
            datatype: xsd.string,
            minCount: 1,
          },
        },
        minCount: 1,
      }],
    })
  })
})
