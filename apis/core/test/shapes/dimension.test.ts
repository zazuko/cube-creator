import { describe, it, before } from 'mocha'
import Parser from '@rdfjs/parser-n3'
import toStream from 'string-to-stream'
import $rdf from 'rdf-ext'
import { DimensionMetadataShape } from '../../bootstrap/shapes/dimension'
import { DatasetCore } from 'rdf-js'
import { expect } from 'chai'
import { rdf, schema, time } from '@tpluscode/rdf-ns-builders'
import { namedNode } from '../support/clownface'
import { GraphPointer } from 'clownface'
import { cube } from '@cube-creator/core/namespace'

const parser = new Parser()

describe('apis/core/bootstrap/shapes/dimension', () => {
  describe('DimensionMetadataShape', () => {
    let shapes: DatasetCore

    before(async () => {
      const quadStream = parser.import(toStream(DimensionMetadataShape.toString({ base: 'http://example.com/' })))
      shapes = await $rdf.dataset().import(quadStream)
    })

    describe('conforming resource', () => {
      const resources: [string, GraphPointer][] = [
        [
          'when cube:dataKind is schema:GeoCoordinates',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(cube.dataKind, dk => dk.addOut(rdf.type, schema.GeoCoordinates)),
        ],
        [
          'when cube:dataKind is time:GeneralDateTimeDescription',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(cube.dataKind, dk =>
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
          'when cube:dataKind time:GeneralDateTimeDescription has no precision unit',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(cube.dataKind, dk => dk.addOut(rdf.type, time.GeneralDateTimeDescription)),
        ],
        [
          'when cube:dataKind schema:GeoShape has superfluous properties',
          namedNode('test')
            .addOut(schema.about, namedNode('dimension'))
            .addOut(cube.dataKind, dk =>
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
