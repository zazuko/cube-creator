import * as fs from 'fs'
import * as path from 'path'
import { Readable } from 'stream'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { Conflict } from 'http-errors'
import { csvw, dtype, hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import clownface, { GraphPointer } from 'clownface'
import { createCSVSource } from '../../../lib/domain/csv-source/upload'
import { TestResourceStore } from '../../support/TestResourceStore'
import type * as CsvSourceQueries from '../../../lib/domain/queries/csv-source'
import '../../../lib/domain'
import type { GetMediaStorage, MediaStorage } from '../../../lib/storage'

describe('domain/csv-sources/upload', () => {
  let storage: MediaStorage
  let getStorage: GetMediaStorage
  let csvSourceQueries: typeof CsvSourceQueries
  let sourceWithFilenameExists: sinon.SinonStub
  let fileStream: Readable
  const data = clownface({ dataset: $rdf.dataset() })
    .namedNode('')
    .addOut(cc.sourceKind, cc.MediaLocal)
    .addOut(schema.name, $rdf.literal('source.csv'))
    .addOut(schema.identifier, $rdf.literal('test/source.csv'))

  beforeEach(() => {
    fileStream = fs.createReadStream(path.resolve(__dirname, '../../../../../minio/cube-creator/test-data/ubd28/input_CH_yearly_air_immission_basetable.csv'))
    storage = {
      getStream: sinon.stub().callsFake(() => fileStream),
      delete: sinon.spy(),
      getDownloadLink: sinon.spy(),
    }
    getStorage = () => (storage)
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
      const store = new TestResourceStore([
        csvMapping,
      ])

      // when
      csvSource = await createCSVSource({
        csvMappingId: csvMapping.term,
        resource: data,
        store,
        getStorage,
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
      const store = new TestResourceStore([
        csvMapping,
      ])
      sourceWithFilenameExists.resolves(true)

      // when
      const creatingSource = createCSVSource({
        csvMappingId: csvMapping.term,
        resource: data,
        store,
        getStorage,
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
      const store = new TestResourceStore([
        csvMapping,
      ])
      // mimics an empty file stream
      fileStream = fs.createReadStream(path.resolve(__dirname, '../../../../../minio/cube-creator/test-data/ubd28/empty.csv'))

      // when
      csvSource = await createCSVSource({
        csvMappingId: csvMapping.term,
        resource: data,
        store,
        getStorage,
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
