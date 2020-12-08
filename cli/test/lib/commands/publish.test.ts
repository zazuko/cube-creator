import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import debug from 'debug'
import { dcat, dcterms, rdf, schema, sh, vcard, xsd } from '@tpluscode/rdf-ns-builders'
import { setupEnv } from '../../support/env'
import { client, parsingClient, insertTestData } from '@cube-creator/testing/lib'
import { cc, cube, scale } from '@cube-creator/core/namespace'
import clownface, { AnyPointer } from 'clownface'
import publish from '../../../lib/commands/publish'
import namespace, { NamespaceBuilder } from '@rdfjs/namespace'
import { NamedNode } from 'rdf-js'

describe('lib/commands/publish', function () {
  this.timeout(200000)

  const ns = {
    baseCube: namespace('https://environment.ld.admin.ch/foen/ubd/28/'),
  }

  const executionUrl = 'http://example.com/transformation-test'

  before(async () => {
    setupEnv()
    await insertTestData('fuseki/sample-ubd.trig')
  })

  describe('produces triples', async function () {
    let cubePointer: AnyPointer
    let targetCube: NamespaceBuilder
    before(async () => {
      // given
      const runner = publish($rdf.namedNode('urn:pipeline:cube-creator#Main'), debug('test'))

      // when
      await runner({
        debug: true,
        jobUri: `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-publish-job`,
        executionUrl,
      })
      await new Promise((resolve) =>
        setTimeout(resolve, 100),
      )

      // then
      const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')
      const [{ expectedGraph }] = await SELECT`?expectedGraph ?revision`
        .FROM(project)
        .WHERE`
          ${project} ${cc.publishGraph} ?expectedGraph .
        `
        .execute(parsingClient.query)

      targetCube = namespace(ns.baseCube('2/').value)

      const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
        .FROM(expectedGraph as NamedNode)
        .WHERE`?s ?p ?o`
        .execute(client.query))

      cubePointer = clownface({ dataset })
    })

    it('does not remove previously published triples', () => {
      const prevCube = cubePointer.namedNode(ns.baseCube('1'))

      expect(prevCube.out().terms).to.have.length(1)
      expect(prevCube).to.matchShape({
        property: {
          path: rdf.type,
          hasValue: cube.Cube,
          minCount: 1,
        },
      })
    })

    it('cube meta data has been copied', async function () {
      expect(cubePointer.namedNode(targetCube())).to.matchShape({
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

        }],
      })

      expect(cubePointer.namedNode(targetCube()).out(dcat.contactPoint)).to.matchShape({
        property: [{
          path: vcard.fn,
          hasValue: $rdf.literal('Test Name'),
          minCount: 1,
        },
        {
          path: vcard.hasEmail,
          hasValue: $rdf.literal('test@mail.ch'),
          minCount: 1,
        }],
      })
    })

    it('observation data has been copied', async function () {
      expect(cubePointer.namedNode(targetCube('observation/blBAS-2002-annualmean'))).to.matchShape({
        property: [{
          path: rdf.type,
          hasValue: cube.Observation,
          minCount: 1,
        }, {
          path: cube.observedBy,
          minCount: 1,
        }, {
          path: targetCube('dimension/year'),
          hasValue: $rdf.literal('2002', xsd.gYear),
          minCount: 1,
          maxCount: 1,
        }, {
          path: targetCube('dimension/value'),
          hasValue: $rdf.literal('6.1', xsd.float),
          minCount: 1,
          maxCount: 1,
        }, {
          path: targetCube('station'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: targetCube('pollutant'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: targetCube('unit-id'),
          hasValue: $rdf.literal('µg/m3'),
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('dimension meta data has been copied', async function () {
      expect(cubePointer.has(rdf.type, sh.NodeShape).term).to.deep.eq(targetCube('shape/'))
      expect(cubePointer.has(rdf.type, sh.NodeShape).terms.length).to.eq(1)
      expect(cubePointer.namedNode(targetCube('shape/'))).to.matchShape({
        property: {
          path: rdf.type,
          hasValue: cube.Constraint,
          minCount: 1,
        },
      })

      expect(cubePointer.namedNode(targetCube('shape/')).out(sh.property).has(sh.path, targetCube('dimension/year'))).to.matchShape({
        property: {
          path: sh.path,
          hasValue: targetCube('dimension/year'),
          minCount: 1,
        },
      })

      expect(cubePointer.namedNode(targetCube('shape/')).out(sh.property).has(sh.path, schema.name)).to.matchShape({
        property: {
          path: schema.name,
          hasValue: $rdf.literal('Jahr', 'de'),
          minCount: 1,
        },
      })

      expect(cubePointer.namedNode(targetCube('shape/')).out(sh.property).has(sh.path, scale.scaleOfMeasure)).to.matchShape({
        property: {
          path: scale.scaleOfMeasure,
          hasValue: scale.Temporal,
          minCount: 1,
        },
      })
    })
  })
})
