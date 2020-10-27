import { describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { getObservationSetId } from '../../lib/cube'

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
})
