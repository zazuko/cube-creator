import type { DatasetCore } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import toStream from 'string-to-stream'
import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import { rdf, schema, time } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '@cube-creator/testing/clownface'
import type { GraphPointer } from 'clownface'
import { meta } from '@cube-creator/core/namespace'
import formats from '@rdfjs-elements/formats-pretty'
import { DimensionMetadataShape } from '../../bootstrap/shapes/dimension.js'

$rdf.formats.import(formats)

describe('apis/core/bootstrap/shapes/dimension', () => {
  describe('DimensionMetadataShape', () => {
    let shapes: DatasetCore

    before(async () => {
      const quadStream = $rdf.formats.parsers.import('text/turtle', toStream(DimensionMetadataShape.toString({ base: 'http://example.com/' })))!
      shapes = await $rdf.dataset().import(quadStream)
    })

    describe('conforming resource', () => {
      const resources: [string, GraphPointer][] = [
        [
          'when meta:dataKind is schema:GeoCoordinates',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(meta.dataKind, dk => dk.addOut(rdf.type, schema.GeoCoordinates)),
        ],
        [
          'when meta:dataKind is time:GeneralDateTimeDescription',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(meta.dataKind, dk =>
              dk.addOut(rdf.type, time.GeneralDateTimeDescription)
                .addOut(time.unitType, time.unitYear)),
        ],
      ]

      for (const [title, resource] of resources) {
        it(title, () => {
          // then
          expect(resource).to.matchShape(shapes)
        })
      }
    })

    describe('non-conforming resource', () => {
      const resources: [string, GraphPointer][] = [
        [
          'when meta:dataKind time:GeneralDateTimeDescription has no precision unit',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(meta.dataKind, dk => dk.addOut(rdf.type, time.GeneralDateTimeDescription)),
        ],
        [
          'when meta:dataKind schema:GeoShape has superfluous properties',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(meta.dataKind, dk =>
              dk.addOut(rdf.type, schema.GeoShape)
                .addOut(time.unitType, time.unitMinute)),
        ],
      ]

      for (const [title, resource] of resources) {
        it(title, () => {
          // then
          expect(resource).not.to.matchShape(shapes)
        })
      }
    })
  })
})
