import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { ASK, CONSTRUCT, DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import debug from 'debug'
import { Hydra } from 'alcaeus/node'
import { csvw, rdf, rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import transform from '../../../lib/commands/transform'
import { setupEnv } from '../../support/env'
import { ccClients, insertTestProject } from '@cube-creator/testing/lib'
import { cc, cube } from '@cube-creator/core/namespace'

describe('lib/commands/transform', function () {
  this.timeout(360 * 1000)

  const executionUrl = 'http://example.com/transformation-test'

  before(async () => {
    setupEnv()
    await insertTestProject()
  })

  describe('successful job', () => {
    const job = `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`
    const expectedGraph = $rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`)
    const cubeBase = 'https://environment.ld.admin.ch/foen/ubd/28/'

    before(async () => {
      // given
      const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

      // when
      await runner({
        to: 'graph-store',
        debug: true,
        job,
        executionUrl,
      })
    })

    it('produces triples', async () => {
      const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
        .FROM(expectedGraph)
        .WHERE`?s ?p ?o`
        .execute(ccClients.streamClient.query))

      const cubePointer = clownface({ dataset })
      expect(cubePointer.has(rdf.type, sh.NodeShape).terms.length).to.eq(1)
      expect(cubePointer.namedNode('https://environment.ld.admin.ch/foen/ubd/28/observation/so2-blBAS-2000-annualmean')).to.matchShape({
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
          hasValue: $rdf.literal('4.7', xsd.float),
          minCount: 1,
          maxCount: 1,
        }, {
          path: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/station'),
          hasValue: $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/station/blBAS'),
          minCount: 1,
          maxCount: 1,
        }],
      })
      expect(cubePointer.namedNode('https://environment.ld.admin.ch/foen/ubd/28/station/blBAS')).to.matchShape({
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
      const hasCubeProperty = await ASK`<https://environment.ld.admin.ch/foen/ubd/28/shape/> ${sh.property}/${sh.path} ${cc.cube} .`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .execute(ccClients.streamClient.query)
      expect(hasCubeProperty).to.eq(false)
    })

    it('does not output csvw:describes as dimension property', async () => {
      const hasDescribesProperty = await ASK`<https://environment.ld.admin.ch/foen/ubd/28/shape/> ${sh.property}/${sh.path} ${csvw.describes} .`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .execute(ccClients.streamClient.query)

      expect(hasDescribesProperty).to.eq(false)
    })

    it('all observations are named nodes', async () => {
      const hasDescribesProperty = await ASK`
        ?observation a ${cube.Observation} .

        FILTER ( BNODE (?observation) )
      `
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .execute(ccClients.streamClient.query)

      expect(hasDescribesProperty).to.eq(false)
    })

    it('removes all CSVW triples but csvw:describes', async () => {
      const distinctCsvwProps = await SELECT.DISTINCT`?prop`
        .FROM($rdf.namedNode(`${env.API_CORE_BASE}cube-project/ubd/cube-data`))
        .WHERE`
          ?s ?prop ?o .
          filter (regex(str(?prop), str(${csvw()})))
        `
        .execute(ccClients.parsingClient.query)

      expect(distinctCsvwProps).to.have.length(1)
      expect(distinctCsvwProps[0].prop).to.deep.eq(csvw.describes)
    })

    it('updates job', async () => {
      const { representation } = await Hydra.loadResource(job)
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
        `.execute(ccClients.parsingClient.query)

      expect(observationValue[0]?.value).to.deep.eq($rdf.literal('', cube.Undefined))
    })

    it('outputs cube:Undefined for missing value mapped to a shared dimension', async () => {
      const result = await SELECT`?value`
        .FROM(expectedGraph)
        .WHERE`
          <https://environment.ld.admin.ch/foen/ubd/28/observation/so2-blBAS-1984-annualmean> <https://environment.ld.admin.ch/foen/ubd/28/unit> ?value
        `.execute(ccClients.parsingClient.query)

      expect(result[0]?.value).to.deep.eq(cube.Undefined)
    })

    it('includes ""^^cube:Undefined in property shape sh:in of literal columns', async () => {
      const dataset = await $rdf.dataset().import(await DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} ${rdfs.comment} .
        `
        .execute(ccClients.streamClient.query, { base: cubeBase }))

      const ins = [...clownface({ dataset }).has(sh.in).out(sh.in).list()!].map(ptr => ptr.term)

      expect(ins).to.deep.contain.members([$rdf.literal('', cube.Undefined)])
    })

    it('includes cube:Undefined in property shape sh:in of mapped columns', async () => {
      const dataset = await $rdf.dataset().import(await DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} <unit> .
        `
        .execute(ccClients.streamClient.query, { base: cubeBase }))

      const ins = [...clownface({ dataset }).has(sh.in).out(sh.in).list()!].map(ptr => ptr.term)

      expect(ins).to.deep.contain.members([cube.Undefined])
    })

    it('emits an sh:or alternative to include cube:Undefined datatype', async () => {
      const dataset = await $rdf.dataset().import(await DESCRIBE`?property`
        .FROM(expectedGraph)
        .WHERE`
          <shape/> ${sh.property} ?property .
          ?property ${sh.path} ${rdfs.comment} .
        `
        .execute(ccClients.streamClient.query, { base: cubeBase }))

      const ors = [...clownface({ dataset }).has(sh.or).out(sh.or).list()!]
        .flatMap(ptr => ptr.out(sh.datatype).terms)

      expect(ors).to.have.length(2)
      expect(ors).to.deep.contain.members([xsd.string, cube.Undefined])
    })
  })

  it('updates job when pipeline has errors', async function () {
    // given
    const jobUri = `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/broken-job`
    const runner = transform($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

    // when
    const jobRun = runner({
      to: 'graph-store',
      debug: true,
      job: jobUri,
      executionUrl,
    })
    await expect(jobRun).to.have.rejected

    // then
    const job = await Hydra.loadResource(jobUri)
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
