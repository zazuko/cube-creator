import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import $rdf from 'rdf-ext'
import * as fs from 'fs'
import * as path from 'path'
import { Readable } from 'stream'
import { cc } from '@cube-creator/core/namespace'
import { Conflict } from 'http-errors'
import { csvw, dtype, hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { uploadFile } from '../../../lib/domain/csv-source/upload'
import { TestResourceStore } from '../../support/TestResourceStore'
import clownface, { GraphPointer } from 'clownface'
import type { FileStorage } from '../../../lib/storage/s3'
import type * as CsvSourceQueries from '../../../lib/domain/queries/csv-source'
import '../../../lib/domain'

describe('domain/csv-sources/upload', () => {
  let fileStorage: FileStorage
  let csvSourceQueries: typeof CsvSourceQueries
  let sourceWithFilenameExists: sinon.SinonStub
  let fileStream: Readable

  beforeEach(() => {
    fileStream = fs.createReadStream(path.resolve(__dirname, '../../../../../minio/cube-creator/test-data/ubd28/input_CH_yearly_air_immission_basetable.csv'))
    fileStorage = {
      loadFile: sinon.stub().callsFake(() => fileStream),
      saveFile: sinon.stub().resolves({ Location: 'file-location' }),
      deleteFile: sinon.spy(),
    }
    sourceWithFilenameExists = sinon.stub().resolves(false)
    csvSourceQueries = {
      sourceWithFilenameExists,
    }
  })

  const csvMapping = clownface({ dataset: $rdf.dataset() })
    .namedNode('csv-mapping')
    .addOut(rdf.type, cc.CsvMapping)

  describe('when source is successfully parsed', () => {
    let csvSource: GraphPointer

    beforeEach(async () => {
      // given
      const file = Buffer.alloc(0)
      const store = new TestResourceStore([
        csvMapping,
      ])

      // when
      csvSource = await uploadFile({
        resource: csvMapping.term,
        store,
        file,
        fileName: 'source.csv',
        fileStorage,
        csvSourceQueries,
      })
    })

    it('creates source graph', () => {
      expect(csvSource).to.matchShape({
        property: [{
          path: rdf.type,
          [sh.hasValue.value]: [cc.CSVSource, hydra.Resource],
          minCount: 2,
        }, {
          path: schema.name,
          hasValue: 'source.csv',
          minCount: 1,
        }, {
          path: cc.csvMapping,
          hasValue: csvMapping.term,
          minCount: 1,
        }, {
          path: schema.associatedMedia,
          minCount: 1,
          node: {
            property: [{
              path: rdf.type,
              hasValue: schema.MediaObject,
              minCount: 1,
            }, {
              path: schema.identifier,
              datatype: xsd.string,
              minCount: 1,
              maxCount: 1,
            }, {
              path: schema.contentUrl,
              nodeKind: sh.IRI,
              minCount: 1,
              maxCount: 1,
            }],
          },
        }],
      })
    })

    it('creates nested resource for sniffed dialect', () => {
      expect(csvSource).to.matchShape({
        property: [{
          path: csvw.dialect,
          minCount: 1,
          maxCount: 1,
          node: {
            property: [{
              path: csvw.quoteChar,
              hasValue: '"',
              minCount: 1,
            }, {
              path: csvw.delimiter,
              hasValue: ',',
              minCount: 1,
            }, {
              path: csvw.headerRowCount,
              hasValue: $rdf.literal('11', xsd.integer),
              minCount: 1,
            }, {
              path: csvw.header,
              hasValue: $rdf.literal('true', xsd.boolean),
              minCount: 1,
            }],
          },
        }],
      })
    })

    it('creates columns with samples', () => {
      expect(csvSource).to.matchShape({
        property: {
          path: csvw.column,
          minCount: 11,
          maxCount: 11,
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
    })
  })

  describe('when source filename already exists', () => {
    it('throws', () => {
      // given
      const file = Buffer.alloc(0)
      const store = new TestResourceStore([
        csvMapping,
      ])
      sourceWithFilenameExists.resolves(true)

      // when
      const creatingSource = uploadFile({
        resource: csvMapping.term,
        store,
        file,
        fileName: 'source.csv',
        fileStorage,
        csvSourceQueries,
      })

      // then
      expect(creatingSource).to.be.rejectedWith(Conflict)
    })
  })

  describe('when source file fails to parse', () => {
    let csvSource: GraphPointer

    beforeEach(async () => {
      // given
      const file = Buffer.alloc(0)
      const store = new TestResourceStore([
        csvMapping,
      ])
      // mimics an empty file stream
      fileStream = fs.createReadStream(path.resolve(__dirname, '../../../../../minio/cube-creator/test-data/ubd28/empty.csv'))

      // when
      csvSource = await uploadFile({
        resource: csvMapping.term,
        store,
        file,
        fileName: 'source.csv',
        fileStorage,
        csvSourceQueries,
      })
    })

    it('creates a source without columns', () => {
      expect(csvSource).to.matchShape({
        property: [{
          path: rdf.type,
          [sh.hasValue.value]: [cc.CSVSource, hydra.Resource],
          minCount: 2,
        }, {
          path: schema.name,
          hasValue: 'source.csv',
          minCount: 1,
        }, {
          path: schema.associatedMedia,
          minCount: 1,
        }, {
          path: csvw.column,
          maxCount: 0,
        }],
      })
    })

    it('sets an error on the source', () => {
      expect(csvSource).to.matchShape({
        property: [{
          path: schema.error,
          nodeKind: sh.Literal,
          datatype: xsd.string,
          minCount: 1,
        }],
      })
    })
  })
})
