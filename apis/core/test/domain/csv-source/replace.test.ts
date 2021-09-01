import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import $rdf from 'rdf-ext'
import * as fs from 'fs'
import * as path from 'path'
import { cc } from '@cube-creator/core/namespace'
import { NamedNode } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { csvw, dtype, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { TestResourceStore } from '../../support/TestResourceStore'
import clownface, { GraphPointer } from 'clownface'
import type { FileStorage } from '../../../lib/storage/s3'
import { replaceFile } from '../../../lib/domain/csv-source/replace'
import { DomainError } from '@cube-creator/api-errors'

describe('domain/csv-sources/replace', () => {
  let fileStorage: FileStorage
  let csvSource: GraphPointer<NamedNode, DatasetExt>
  let csvMapping: GraphPointer<NamedNode, DatasetExt>
  const data = clownface({ dataset: $rdf.dataset() })
    .namedNode('')
    .addOut(cc.sourceKind, cc.MediaLocal)
    .addOut(schema.name, $rdf.literal('source.csv'))
    .addOut(schema.identifier, $rdf.literal('test/source.csv'))
    .addOut(schema.contentUrl, $rdf.namedNode('http://s3/test/source.csv'))

  beforeEach(() => {
    const getfileStream = () => fs.createReadStream(path.resolve(__dirname, '../../fixtures/CH_yearly_air_immission_unit_id.csv'))
    fileStorage = {
      loadFile: sinon.stub().callsFake(getfileStream),
      saveFile: sinon.stub().resolves({ Location: 'file-location' }),
      deleteFile: sinon.spy(),
      getDownloadLink: sinon.spy(),
    }

    csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('csv-mapping')
      .addOut(rdf.type, cc.CsvMapping)
  })

  describe('when source is successfully parsed', () => {
    let csvSourceUpdate: GraphPointer
    beforeEach(async () => {
      // given
      csvSource = clownface({ dataset: $rdf.dataset() })
        .namedNode('source')
        .addOut(rdf.type, cc.CSVSource)
        .addOut(schema.name, 'Name')
        .addOut(schema.error, 'Previous upload had an error')
        .addOut(csvw.dialect, dialect => {
          dialect.addOut(csvw.quoteChar, '"')
          dialect.addOut(csvw.delimiter, ',')
        })
        .addOut(cc.csvMapping, csvMapping)
        .addOut(schema.associatedMedia, file => {
          file.addOut(schema.identifier, 'file.csv')
            .addOut(schema.contentUrl, $rdf.namedNode('url.to.file'))
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_id'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_id')
            .addOut(dtype.order, 0)
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_name_de'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_name_de')
            .addOut(dtype.order, 1)
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_name_fr'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_name_fr')
            .addOut(dtype.order, 2)
        })

      const store = new TestResourceStore([
        csvSource,
      ])

      // when
      csvSourceUpdate = await replaceFile({
        csvSourceId: csvSource.term,
        resource: data,
        store,
        fileStorage,
      })
    })

    it('associated media is updated', () => {
      expect(csvSourceUpdate).to.matchShape({
        property: [{
          path: rdf.type,
          [sh.hasValue.value]: [cc.CSVSource],
          minCount: 1,
        }, {
          path: schema.name,
          hasValue: 'Name',
          minCount: 1,
        }, {
          path: cc.csvMapping,
          hasValue: csvMapping,
          minCount: 1,
        }, {
          path: schema.associatedMedia,
          minCount: 1,
          node: {
            property: [
              {
                path: cc.sourceKind,
                hasValue: cc.MediaLocal,
                minCount: 1,
                maxCount: 1,
              },
              {
                path: schema.identifier,
                datatype: xsd.string,
                hasValue: 'test/source.csv',
                minCount: 1,
                maxCount: 1,
              }, {
                path: schema.contentUrl,
                nodeKind: sh.IRI,
                hasValue: $rdf.namedNode('http://s3/test/source.csv'),
                minCount: 1,
                maxCount: 1,
              }],
          },
        }],
      })
    })

    it('removes the previous parse error', () => {
      expect(csvSource).to.matchShape({
        property: [{
          path: schema.error,
          maxCount: 0,
        }],
      })
    })

    it('File handler have been called', () => {
      // validate file, read columns and sample
      expect(fileStorage.loadFile).has.been.calledTwice
      // delete old file
      expect(fileStorage.deleteFile).has.been.calledOnce
    })

    it('updates or creates columns with samples', () => {
      expect(csvSource).to.matchShape({
        property: {
          path: csvw.column,
          minCount: 4,
          maxCount: 4,
          node: {
            property: [{
              path: rdf.type,
              hasValue: csvw.Column,
              minCount: 1,
            }, {
              path: schema.name,
              minCount: 1,
              maxCount: 1,
            }, {
              path: dtype.order,
              datatype: xsd.integer,
              minCount: 1,
              maxCount: 1,
            }, {
              path: cc.csvColumnSample,
              nodeKind: sh.Literal,
              minCount: 1,
              maxCount: 3,
            }],
          },
        },
      })

      const columnunitNameFr = csvSource.namedNode('column/unit_name_fr')
      expect(columnunitNameFr.out(schema.name).value).to.equal('unit_name_fr')
      expect(columnunitNameFr.out(dtype.order).value).to.equal('2')
    })
  })

  describe('when source has different column order', () => {
    let csvSourceUpdate: GraphPointer
    beforeEach(async () => {
      // given
      csvSource = clownface({ dataset: $rdf.dataset() })
        .namedNode('source')
        .addOut(rdf.type, cc.CSVSource)
        .addOut(schema.name, 'Name')
        .addOut(csvw.dialect, dialect => {
          dialect.addOut(csvw.quoteChar, '"')
          dialect.addOut(csvw.delimiter, ',')
        })
        .addOut(cc.csvMapping, csvMapping)
        .addOut(schema.associatedMedia, file => {
          file.addOut(schema.identifier, 'file.csv')
            .addOut(schema.contentUrl, $rdf.namedNode('url.to.file'))
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_id'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_id')
            .addOut(dtype.order, 0)
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_name_fr'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_name_fr')
            .addOut(dtype.order, 1)
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_name_de'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_name_de')
            .addOut(dtype.order, 2)
        })
        .addOut(csvw.column, $rdf.namedNode('column/unit_name_en'), column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_name_en')
            .addOut(dtype.order, 3)
        })

      const store = new TestResourceStore([
        csvSource,
      ])

      // when
      csvSourceUpdate = await replaceFile({
        csvSourceId: csvSource.term,
        resource: data,
        store,
        fileStorage,
      })
    })

    it('updates associated media', () => {
      expect(csvSourceUpdate).to.matchShape({
        property: [{
          path: rdf.type,
          [sh.hasValue.value]: [cc.CSVSource],
          minCount: 1,
        }, {
          path: schema.name,
          hasValue: 'Name',
          minCount: 1,
        }, {
          path: cc.csvMapping,
          hasValue: csvMapping,
          minCount: 1,
        }, {
          path: schema.associatedMedia,
          minCount: 1,
          node: {
            property: [
              {
                path: cc.sourceKind,
                hasValue: cc.MediaLocal,
                minCount: 1,
                maxCount: 1,
              },
              {
                path: schema.identifier,
                datatype: xsd.string,
                hasValue: 'test/source.csv',
                minCount: 1,
                maxCount: 1,
              }, {
                path: schema.contentUrl,
                nodeKind: sh.IRI,
                hasValue: $rdf.namedNode('http://s3/test/source.csv'),
                minCount: 1,
                maxCount: 1,
              }],
          },
        }],
      })
    })

    it('File handler have been called', () => {
      // validate file, read columns and sample
      expect(fileStorage.loadFile).has.been.calledTwice
      // delete old file
      expect(fileStorage.deleteFile).has.been.calledOnce
    })

    it('updates columns with samples', () => {
      expect(csvSource).to.matchShape({
        property: {
          path: csvw.column,
          minCount: 4,
          maxCount: 4,
          node: {
            property: [{
              path: rdf.type,
              hasValue: csvw.Column,
              minCount: 1,
            }, {
              path: schema.name,
              minCount: 1,
              maxCount: 1,
            }, {
              path: dtype.order,
              datatype: xsd.integer,
              minCount: 1,
              maxCount: 1,
            }, {
              path: cc.csvColumnSample,
              nodeKind: sh.Literal,
              minCount: 1,
              maxCount: 3,
            }],
          },
        },
      })

      const columnunitNameFr = csvSource.namedNode('column/unit_name_fr')
      expect(columnunitNameFr.out(schema.name).value).to.equal('unit_name_fr')
      expect(columnunitNameFr.out(dtype.order).value).to.equal('2')
    })
  })

  describe('when columns are missing', () => {
    it('throws', () => {
      // given
      csvSource = clownface({ dataset: $rdf.dataset() })
        .namedNode('source')
        .addOut(rdf.type, cc.CSVSource)
        .addOut(schema.name, 'Name')
        .addOut(csvw.dialect, dialect => {
          dialect.addOut(csvw.quoteChar, '"')
          dialect.addOut(csvw.delimiter, ',')
        })
        .addOut(cc.csvMapping, csvMapping)
        .addOut(schema.associatedMedia, file => {
          file.addOut(schema.identifier, 'file.csv')
        })
        .addOut(csvw.column, column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'unit_id')
            .addOut(dtype.order, 0)
        })
        .addOut(csvw.column, column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'column2')
            .addOut(dtype.order, 1)
        })
        .addOut(csvw.column, column => {
          column.addOut(rdf.type, csvw.Column)
            .addOut(schema.name, 'column3')
            .addOut(dtype.order, 2)
        })

      const store = new TestResourceStore([
        csvSource,
      ])

      // when
      const csvSourceUpdate = replaceFile({
        csvSourceId: csvSource.term,
        resource: data,
        store,
        fileStorage,
      })

      // then
      expect(csvSourceUpdate).to.be.rejectedWith(DomainError)
    })
  })
})
