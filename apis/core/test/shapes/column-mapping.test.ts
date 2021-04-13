import { describe, it, beforeEach } from 'mocha'
import Parser from '@rdfjs/parser-n3'
import toStream from 'string-to-stream'
import $rdf from 'rdf-ext'
import { ColumnMappingShape } from '../../bootstrap/shapes/column-mapping'
import { DatasetCore } from 'rdf-js'
import { expect } from 'chai'
import { csvw, rdf } from '@tpluscode/rdf-ns-builders'
import { blankNode } from '@cube-creator/testing/clownface'
import { cc } from '@cube-creator/core/namespace'
import { GraphPointer } from 'clownface'

const parser = new Parser()

function minimalMapping() {
  return blankNode()
    .addOut(cc.sourceColumn, sourceColumn => sourceColumn.addOut(rdf.type, csvw.Column))
    .addOut(cc.targetProperty, 'property')
}

describe('apis/core/bootstrap/shapes/dimension', () => {
  describe('ColumnMappingShape', () => {
    let shapes: DatasetCore

    beforeEach(async () => {
      const quadStream = parser.import(toStream(ColumnMappingShape.toString({ base: 'http://example.com/' })))
      shapes = await $rdf.dataset().import(quadStream)
    })

    describe('literal column', () => {
      let mapping: GraphPointer

      beforeEach(() => {
        mapping = minimalMapping().addOut(rdf.type, cc.LiteralColumnMapping)
      })

      it('matches shape with source and target', () => {
        mapping
          .addOut(cc.keyDimension, false)
          .addOut(cc.measureDimension, false)

        expect(mapping).to.matchShape(shapes)
      })

      it('cannot have both key and measure dimension flag', () => {
        mapping.addOut(cc.keyDimension, true)
          .addOut(cc.measureDimension, true)

        expect(mapping).not.to.matchShape(shapes)
      })

      it('can be a key dimension', () => {
        mapping
          .addOut(cc.keyDimension, true)
          .addOut(cc.measureDimension, false)

        expect(mapping).to.matchShape(shapes)
      })

      it('can be a measure dimension', () => {
        mapping
          .addOut(cc.keyDimension, true)
          .addOut(cc.measureDimension, false)

        expect(mapping).to.matchShape(shapes)
      })
    })

    describe('reference column', () => {
      let mapping: GraphPointer

      beforeEach(() => {
        mapping = minimalMapping().addOut(rdf.type, cc.ReferenceColumnMapping)
          .addOut(cc.referencedTable, ref => ref.addOut(rdf.type, cc.Table))
      })

      it('matches shape with source and target', () => {
        mapping
          .addOut(cc.keyDimension, false)
          .addOut(cc.measureDimension, false)

        expect(mapping).to.matchShape(shapes)
      })

      it('cannot have both key and measure dimension flag', () => {
        mapping.addOut(cc.keyDimension, true)
          .addOut(cc.measureDimension, true)

        expect(mapping).not.to.matchShape(shapes)
      })

      it('can be a key dimension', () => {
        mapping
          .addOut(cc.keyDimension, true)
          .addOut(cc.measureDimension, false)

        expect(mapping).to.matchShape(shapes)
      })

      it('can be a measure dimension', () => {
        mapping
          .addOut(cc.keyDimension, true)
          .addOut(cc.measureDimension, false)

        expect(mapping).to.matchShape(shapes)
      })
    })
  })
})
