import env from '@cube-creator/core/env'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { ASK, CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { csvw, dcat, dcterms, qudt, rdf, schema, sh, vcard, xsd } from '@tpluscode/rdf-ns-builders'
import { setupEnv } from '../../support/env'
import { ccClients } from '@cube-creator/testing/lib'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { cc, cube } from '@cube-creator/core/namespace'
import clownface, { AnyPointer } from 'clownface'
import runner from '../../../lib/commands/publish'
import namespace, { NamespaceBuilder } from '@rdfjs/namespace'
import { NamedNode, Term } from 'rdf-js'

describe('@cube-creator/cli/lib/commands/publish', function () {
  this.timeout(200000)

  const ns = {
    baseCube: namespace('https://environment.ld.admin.ch/foen/ubd/28/'),
  }

  const executionUrl = 'http://example.com/transformation-test'

  before(async () => {
    setupEnv()
    await insertTestProject()
  })

  describe('produces triples', async function () {
    let cubePointer: AnyPointer
    let targetCube: NamespaceBuilder
    before(async () => {
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
      const project = $rdf.namedNode('https://cube-creator.lndo.site/cube-project/ubd')
      const [{ expectedGraph }] = await SELECT`?expectedGraph`
        .WHERE`
          graph ${project} {
            ${project} ${schema.maintainer} ?org .
          }

          graph ?org {
            ?org ${cc.publishGraph} ?expectedGraph .
          }
        `
        .execute(ccClients.parsingClient.query)

      targetCube = namespace(ns.baseCube('3/').value)

      const dataset = await $rdf.dataset().import(await CONSTRUCT`?s ?p ?o`
        .FROM(expectedGraph as NamedNode)
        .WHERE`?s ?p ?o`
        .execute(ccClients.streamClient.query))

      cubePointer = clownface({ dataset })
    })

    it('does not remove previously published triples', () => {
      const prevCube = cubePointer.namedNode(ns.baseCube('1'))

      expect(prevCube.out().terms).to.have.length.greaterThan(0)
      expect(prevCube).to.matchShape({
        property: {
          path: rdf.type,
          hasValue: cube.Cube,
          minCount: 1,
        },
      })
    })

    it('adds relation to parent cube', () => {
      expect(cubePointer.namedNode(ns.baseCube())).matchShape({
        property: [{
          path: rdf.type,
          hasValue: schema.CreativeWork,
          minCount: 1,
          maxCount: 1,
        }, {
          path: schema.hasPart,
          hasValue: targetCube(),
          minCount: 1,
        }],
      })
    })

    it('cube meta data has been copied', async function () {
      expect(cubePointer.namedNode(targetCube())).to.matchShape({
        property: [{
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

    it('sets cube version', async function () {
      expect(cubePointer.namedNode(targetCube())).to.matchShape({
        property: [{
          path: schema.version,
          hasValue: $rdf.literal('3', xsd.integer),
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('adds modified date to published cube', async function () {
      expect(cubePointer.namedNode(targetCube())).to.matchShape({
        property: [{
          path: schema.dateModified,
          datatype: xsd.dateTime,
          minCount: 1,
          maxCount: 1,
        }, {
          path: dcterms.modified,
          datatype: xsd.dateTime,
          minCount: 1,
          maxCount: 1,
          [sh.equals.value]: schema.dateModified,
        }],
      })
    })

    it('adds project identifier to dataset metadata', async function () {
      expect(cubePointer.namedNode(targetCube())).to.matchShape({
        property: [{
          path: dcterms.identifier,
          hasValue: $rdf.literal('ubd/28'),
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('"deprecates" previous cubes', async function () {
      expect(cubePointer.namedNode(ns.baseCube('1'))).to.matchShape({
        property: [{
          path: schema.validThrough,
          datatype: xsd.dateTime,
          minCount: 1,
          maxCount: 1,
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
          path: ns.baseCube('dimension/year'),
          hasValue: $rdf.literal('2002', xsd.gYear),
          minCount: 1,
          maxCount: 1,
        }, {
          path: ns.baseCube('dimension/value'),
          hasValue: $rdf.literal('6.1', xsd.float),
          minCount: 1,
          maxCount: 1,
        }, {
          path: ns.baseCube('station'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: ns.baseCube('pollutant'),
          minCount: 1,
          maxCount: 1,
        }, {
          path: ns.baseCube('unit'),
          hasValue: $rdf.namedNode('http://qudt.org/vocab/unit/MicroGM-PER-M3'),
          minCount: 1,
          maxCount: 1,
        }],
      })
    })

    it('emits organization as cube:observedBy value', async () => {
      const observedBy = cubePointer.has(cube.observedBy).out(cube.observedBy).terms

      expect(observedBy).to.containAll<Term>(observer => observer.equals($rdf.namedNode(`${env.API_CORE_BASE}organization/bafu`)))
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

      const props = cubePointer.namedNode(targetCube('shape/')).out(sh.property)
      const yearPropShape = props.has(sh.path, ns.baseCube('dimension/year'))
      expect(yearPropShape).to.matchShape({
        property: {
          path: sh.path,
          hasValue: ns.baseCube('dimension/year'),
          minCount: 1,
        },
      })

      expect(yearPropShape).to.matchShape({
        property: {
          path: schema.name,
          hasValue: $rdf.literal('Jahr', 'de'),
          minCount: 1,
        },
      })

      expect(yearPropShape).to.matchShape({
        property: {
          path: qudt.scaleType,
          hasValue: qudt.IntervalScale,
          minCount: 1,
        },
      })
    })

    it('removes all csvw triples', async () => {
      const distinctCsvwProps = await SELECT.DISTINCT`(count(distinct ?p) as ?count)`
        .FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube'))
        .WHERE`
          ?s ?p ?o .
          filter (regex(str(?p), str(${csvw()})))
        `
        .execute(ccClients.parsingClient.query)

      expect(distinctCsvwProps[0].count.value).to.eq('0')
    })

    it('does not inject revision into dimension predicates', async () => {
      const anyObservationPredicateHasRevision = await ASK`
        ?observation a ${cube.Observation} .
        ?observation ?dimension ?value .

        FILTER ( REGEX (str(?dimension), str(${targetCube()}) ) )
      `.FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube')).execute(ccClients.streamClient.query)
      const anyShapePropertyHasRevision = await ASK`
        ?shape a ${cube.Constraint} .
        ?shape ${sh.property}/${sh.path} ?dimension .

        FILTER ( REGEX (str(?dimension), str(${targetCube()}) ) )
      `.FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube')).execute(ccClients.streamClient.query)

      expect(anyObservationPredicateHasRevision).to.be.false
      expect(anyShapePropertyHasRevision).to.be.false
    })

    it("adds cube:SharedDimension to mapped dimension's metadata", async () => {
      const props = cubePointer.namedNode(targetCube('shape/')).out(sh.property)
      const pollutantPropShape = props.has(sh.path, ns.baseCube('pollutant'))

      expect(pollutantPropShape.has(rdf.type, cube.SharedDimension).terms).to.have.length(1)
    })

    it('does not add cube:SharedDimension to unmapped nominal dimension', async () => {
      const props = cubePointer.namedNode(targetCube('shape/')).out(sh.property)
      const stationPropShape = props.has(sh.path, ns.baseCube('station'))

      expect(stationPropShape.has(rdf.type, cube.SharedDimension).terms).to.have.length(0)
    })

    it('adds schema:sameAs to concepts linked to observation dimensions', async () => {
      const sameAsAdded = await ASK`
        ${targetCube('station/blBAS')} ${schema.sameAs} ${ns.baseCube('station/blBAS')}
      `.FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube')).execute(ccClients.streamClient.query)

      expect(sameAsAdded).to.be.true
    })

    it('does not add schema:sameAs to concepts outside cube namespace', async () => {
      const sameAsAdded = await ASK`
        <http://www.wikidata.org/entity/Q2025> ${schema.sameAs} ?any
      `.FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube')).execute(ccClients.streamClient.query)

      expect(sameAsAdded).to.be.false
    })

    it('does not add schema:sameAs to objects of non-dimension properties`', async () => {
      const sameAsAdded = await ASK`
        ${targetCube('maintainer/blBAS')} ${schema.sameAs} ?any
      `.FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube')).execute(ccClients.streamClient.query)

      expect(sameAsAdded).to.be.false
    })

    it('injects version to versioned dimensions', async () => {
      const results = await SELECT`?dimension`
        .WHERE`
          ?shape a ${cube.Constraint} .
          ?shape ${sh.property} ?property .
          ?property ${sh.path} ?dimension ; ${schema.version} ?version
        `
        .FROM($rdf.namedNode('https://lindas.admin.ch/foen/cube'))
        .execute(ccClients.parsingClient.query)

      expect(results).to.have.length(2)
      expect(results).to.deep.contain.members([{
        dimension: ns.baseCube.station,
      }, {
        dimension: ns.baseCube.aggregation,
      }])
    })
  })
})
