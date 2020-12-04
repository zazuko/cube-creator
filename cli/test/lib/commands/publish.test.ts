
import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import debug from 'debug'
import { dcat, dcterms, rdf, schema, sh, vcard, xsd } from '@tpluscode/rdf-ns-builders'
import { setupEnv } from '../../support/env'
import { client, insertTestData } from '@cube-creator/testing/lib'
import { cube, scale } from '@cube-creator/core/namespace'
import clownface from 'clownface'
import publish from '../../../lib/commands/publish'
import namespace from '@rdfjs/namespace'

describe('lib/commands/publish', function () {
  this.timeout(200000)

  const ns = {
    targetCube: namespace('https://environment.ld.admin.ch/foen/ubd/28/'),
  }

  const executionUrl = 'http://example.com/transformation-test'

  before(async () => {
    setupEnv()
    await insertTestData('fuseki/sample-ubd.trig')
  })

  it('produces triples', async function () {
    // given
    const runner = publish($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

    // when
    await runner({
      debug: true,
      job: `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-publish-job`,
      executionUrl,
    })
    await new Promise((resolve) =>
      setTimeout(resolve, 100),
    )

    // then
    const expectedGraph = ns.targetCube()
    const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
      .FROM(expectedGraph)
      .WHERE`?s ?p ?o`
      .execute(client.query))

    const cubePointer = clownface({ dataset })
    expect(cubePointer.has(rdf.type, sh.NodeShape).terms.length).to.eq(1)

    expect(cubePointer).to.matchShape({
      property: [{
        path: dcterms.identifier,
        hasValue: $rdf.literal('UBD28@BAFU'),
        minCount: 1,
        maxCount: 1,
      }, {
        path: dcterms.title,
        hasValue: $rdf.literal('UBD28'),
        minCount: 1,
        maxCount: 1,
      }, {
        path: dcat.contactPoint,
        minCount: 1,
        maxCount: 1,
        node: {
          property: [{
            path: vcard.fn,
            hasValue: $rdf.literal('Test Name'),
            minCount: 1,
          },
          {
            path: vcard.fn,
            hasValue: $rdf.literal('test@mail.ch'),
            minCount: 1,
          }],
        },
      }],
    })

    expect(cubePointer.namedNode(ns.targetCube('observation/blBAS-2002-annualmean'))).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cube.Observation,
        minCount: 1,
      }, {
        path: cube.observedBy,
        minCount: 1,
      }, {
        path: ns.targetCube('dimension/year'),
        hasValue: $rdf.literal('2002', xsd.gYear),
        minCount: 1,
        maxCount: 1,
      }, {
        path: ns.targetCube('dimension/value'),
        hasValue: $rdf.literal('6.1', xsd.float),
        minCount: 1,
        maxCount: 1,
      }, {
        path: ns.targetCube('station'),
        minCount: 1,
        maxCount: 1,
      }, {
        path: ns.targetCube('pollutant'),
        minCount: 1,
        maxCount: 1,
      }, {
        path: ns.targetCube('unit-id'),
        hasValue: $rdf.literal('µg/m3'),
        minCount: 1,
        maxCount: 1,
      }],
    })

    expect(cubePointer.namedNode(ns.targetCube('shape/'))).to.matchShape({
      property: {
        path: rdf.type,
        hasValue: cube.Constraint,
        minCount: 1,
      },
    })

    expect(cubePointer.namedNode(ns.targetCube('shape/')).out(sh.property).has(sh.path, ns.targetCube('dimension/year'))).to.matchShape({
      property: {
        path: sh.path,
        hasValue: ns.targetCube('dimension/year'),
        minCount: 1,
      },
    })

    expect(cubePointer.namedNode(ns.targetCube('shape/')).out(sh.property).has(sh.path, schema.name)).to.matchShape({
      property: {
        path: schema.name,
        hasValue: $rdf.literal('Jahr', 'de'),
        minCount: 1,
      },
    })

    expect(cubePointer.namedNode(ns.targetCube('shape/')).out(sh.property).has(sh.path, scale.scaleOfMeasure)).to.matchShape({
      property: {
        path: scale.scaleOfMeasure,
        hasValue: scale.Temporal,
        minCount: 1,
      },
    })
  })
})
