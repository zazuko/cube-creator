import { describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from '@zazuko/env'
import { cc, cube } from '@cube-creator/core/namespace'
import { rdf } from '@tpluscode/rdf-ns-builders'
import type { Context } from 'barnard59-core'
import { CCEnv } from '@cube-creator/env'
import { getObservationSetId, injectRevision } from '../../lib/cube.js'
import { logger } from '../support/logger.js'

describe('lib/cube', () => {
  describe('getObservationSetId', () => {
    it('returns URI by appending segment', () => {
      // given
      const dataset = $rdf.dataset([
        $rdf.quad($rdf.blankNode(), cc.cube, $rdf.namedNode('http://example.com/my/cube/')),
      ])

      // when
      const observationSetId = getObservationSetId({ dataset })

      // then
      expect(observationSetId.value).to.eq('http://example.com/my/cube/observation/')
    })

    it('returns URI by appending to hash fragment', () => {
      // given
      const dataset = $rdf.dataset([
        $rdf.quad($rdf.blankNode(), cc.cube, $rdf.namedNode('http://example.com/my/cube#')),
      ])

      // when
      const observationSetId = getObservationSetId({ dataset })

      // then
      expect(observationSetId.value).to.eq('http://example.com/my/cube#observation/')
    })

    it('returns URI by appending segment when cube does not end in slash', () => {
      // given
      const dataset = $rdf.dataset([
        $rdf.quad($rdf.blankNode(), cc.cube, $rdf.namedNode('http://example.com/my/cube')),
      ])

      // when
      const observationSetId = getObservationSetId({ dataset })

      // then
      expect(observationSetId.value).to.eq('http://example.com/my/cube/observation/')
    })
  })

  describe('injectRevision', () => {
    const cases = [
      ['no/slash', 'no/slash', 'no/slash/5'],
      ['no/slash', 'no/slash/', 'no/slash/5/'],
      ['no/slash/', 'no/slash', 'no/slash/5'],
      ['no/slash/', 'no/slash/', 'no/slash/5/'],
      ['no/slash', 'no/slash/foo', 'no/slash/5/foo'],
      ['no/slash', 'no/slash/foo/', 'no/slash/5/foo/'],
      ['no/slash/', 'no/slash/foo', 'no/slash/5/foo'],
      ['no/slash/', 'no/slash/foo/', 'no/slash/5/foo/'],
    ]

    cases.forEach(([namespace, term, expected]) => {
      it(`ensures a slash between base and version (term = ${term}; namespace = ${namespace})`, async () => {
        // given
        const context = {
          logger,
          variables: new Map<any, any>([
            ['namespace', 'http://example.com/cube/' + namespace],
            ['revision', 5],
          ]),
        } as unknown as Context<CCEnv>
        const quads = $rdf.dataset([
          $rdf.quad(
            $rdf.namedNode('http://example.com/cube/' + term),
            rdf.type,
            cube.Cube),
        ]).toStream()

        // when
        const transform = await injectRevision.call(context)
        const transformed = await $rdf.dataset().import(quads.pipe(transform))

        // then
        expect([...transformed][0].subject).to.deep.eq($rdf.namedNode('http://example.com/cube/' + expected))
      })
    })
  })
})
