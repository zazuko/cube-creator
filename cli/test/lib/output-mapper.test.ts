import { env } from 'process'
import { before, describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { cube } from '@cube-creator/core/namespace'
import { insertTestProject } from '@cube-creator/testing/lib/seedData'
import { Hydra } from 'alcaeus/node'
import * as Models from '@cube-creator/model'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { setupEnv } from '../support/env'
import { mapDimensions } from '../../lib/output-mapper'

Hydra.resources.factory.addMixin(...Object.values(Models))

describe('lib/output-mapper', function () {
  this.timeout(20 * 1000)

  before(async () => {
    setupEnv()
    await insertTestProject()
  })

  describe('mapDimensions', () => {
    const predicate = $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/pollutant')

    const context = {
      variables: new Map<any, any>([
        ['jobUri', `${env.API_CORE_BASE}cube-project/ubd/csv-mapping/jobs/test-job`],
        ['apiClient', Hydra],
      ]),
    }

    it('mapped value is replaced', async () => {
      // given

      const obsId = $rdf.namedNode('observation')
      const quads = $rdf.dataset([
        $rdf.quad(
          obsId,
          predicate,
          $rdf.literal('co'),
          cube.Cube),
      ]).toStream()

      // when
      const map = await mapDimensions.call(context)
      const mapped = await $rdf.dataset().import(quads.pipe(map))

      // then
      const match = mapped.match(obsId, predicate, $rdf.namedNode('http://www.wikidata.org/entity/Q2025'))
      expect(match.size).to.equal(1)
    })

    it('mapped value is taken at face value', async () => {
      // given

      const obsId = $rdf.namedNode('observation')
      const quads = $rdf.dataset([
        $rdf.quad(
          obsId,
          predicate,
          $rdf.literal('co', xsd.anyAtomicType),
          cube.Cube),
      ]).toStream()

      // when
      const map = await mapDimensions.call(context)
      const mapped = await $rdf.dataset().import(quads.pipe(map))

      // then
      const match = mapped.match(obsId, predicate, $rdf.namedNode('http://www.wikidata.org/entity/Q2025'))
      expect(match.size).to.equal(1)
    })

    it('unmapped value with entry does not change', async () => {
      // given

      const quads = $rdf.dataset([
        $rdf.quad(
          $rdf.namedNode('observation'),
          predicate,
          $rdf.literal('so2'),
          cube.Cube),
      ]).toStream()

      // when
      const map = await mapDimensions.call(context)
      const mapped = await $rdf.dataset().import(quads.pipe(map))

      // then
      const quad = mapped.toArray()[0]
      expect(quad.subject.value).to.deep.eq('observation')
      expect(quad.predicate.value).to.deep.eq(predicate.value)
      expect(quad.object.value).to.deep.eq('so2')
    })

    it('unmapped value without entry does not change', async () => {
      // given

      const quads = $rdf.dataset([
        $rdf.quad(
          $rdf.namedNode('observation'),
          predicate,
          $rdf.literal('abc'),
          cube.Cube),
      ]).toStream()

      // when
      const map = await mapDimensions.call(context)
      const mapped = await $rdf.dataset().import(quads.pipe(map))

      // then
      const quad = mapped.toArray()[0]
      expect(quad.subject.value).to.deep.eq('observation')
      expect(quad.predicate.value).to.deep.eq(predicate.value)
      expect(quad.object.value).to.deep.eq('abc')
    })

    it('nothing happens when there is no mapping', async () => {
      // given

      const quads = $rdf.dataset([
        $rdf.quad(
          $rdf.namedNode('observation'),
          $rdf.namedNode('https://environment.ld.admin.ch/foen/ubd/28/dimension/year'),
          $rdf.literal('2020'),
          cube.Cube),
      ]).toStream()

      // when
      const map = await mapDimensions.call(context)
      const mapped = await $rdf.dataset().import(quads.pipe(map))

      // then
      const quad = mapped.toArray()[0]
      expect(quad.subject.value).to.deep.eq('observation')
      expect(quad.predicate.value).to.deep.eq('https://environment.ld.admin.ch/foen/ubd/28/dimension/year')
      expect(quad.object.value).to.deep.eq('2020')
    })
  })
})
