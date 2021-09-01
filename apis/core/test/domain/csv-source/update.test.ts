import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import * as fs from 'fs'
import * as path from 'path'
import { Readable } from 'stream'
import { NamedNode } from 'rdf-js'
import { csvw, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { TestResourceStore } from '../../support/TestResourceStore'
import clownface, { GraphPointer } from 'clownface'
import type { FileStorage } from '../../../lib/storage/s3'
import '../../../lib/domain'
import { update } from '../../../lib/domain/csv-source/update'

describe('domain/csv-sources/upload', () => {
  let fileStorage: FileStorage
  let csvSource: GraphPointer<NamedNode, DatasetExt>
  let fileStream: Readable

  beforeEach(() => {
    fileStream = fs.createReadStream(path.resolve(__dirname, '../../../../../minio/cube-creator/test-data/ubd28/input_CH_yearly_air_immission_basetable.csv'))
    fileStorage = {
      loadFile: sinon.stub().callsFake(() => fileStream),
      saveFile: sinon.stub().resolves({ Location: 'file-location' }),
      deleteFile: sinon.spy(),
      getDownloadLink: sinon.spy(),
    }
    csvSource = clownface({ dataset: $rdf.dataset() })
      .namedNode('source')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(schema.name, 'Old name')
      .addOut(csvw.dialect, dialect => {
        dialect.addOut(csvw.quoteChar, '"')
        dialect.addOut(csvw.delimiter, ';')
      })
      .addOut(schema.associatedMedia, file => {
        file.addOut(schema.identifier, 'file.csv')
      })
      .addOut(csvw.column, $rdf.namedNode('Column'))
  })

  it('it updates the name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('source')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(schema.name, 'New name')
      .addOut(csvw.dialect, dialect => {
        dialect.addOut(csvw.quoteChar, '"')
        dialect.addOut(csvw.delimiter, ';')
      })
    const store = new TestResourceStore([
      csvSource,
    ])

    // when
    const changed = await update({
      resource,
      fileStorage,
      store,
    })

    // then
    expect(changed).to.matchShape({
      property: {
        path: schema.name,
        hasValue: 'New name',
        minCount: 1,
      },
    })
  })

  it('it does not load source if dialect does not change', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('source')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(schema.name, 'Old name')
      .addOut(csvw.dialect, dialect => {
        dialect.addOut(csvw.quoteChar, '"')
        dialect.addOut(csvw.delimiter, ';')
      })
    const store = new TestResourceStore([
      csvSource,
    ])

    // when
    await update({
      resource,
      fileStorage,
      store,
    })

    // then
    expect(fileStorage.loadFile).not.called
  })

  it('loads the source file when dialect changes', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('source')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(schema.name, 'Old name')
      .addOut(csvw.dialect, dialect => {
        dialect.addOut(csvw.quoteChar, '"')
        dialect.addOut(csvw.delimiter, ',')
      })
    const store = new TestResourceStore([
      csvSource,
    ])

    // when
    await update({
      resource,
      fileStorage,
      store,
    })

    // then
    expect(fileStorage.loadFile).calledOnceWithExactly('file.csv')
  })

  it('it updates dialect when necessary', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('source')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(schema.name, 'Old name')
      .addOut(csvw.dialect, dialect => {
        dialect.addOut(rdf.type, csvw.Dialect)
          .addOut(csvw.quoteChar, '"')
          .addOut(csvw.delimiter, ',')
      })
    const store = new TestResourceStore([
      csvSource,
    ])

    // when
    const changed = await update({
      resource,
      fileStorage,
      store,
    })

    // then
    expect(changed).to.matchShape({
      property: {
        path: csvw.dialect,
        minCount: 1,
        maxCount: 1,
        node: {
          property: [{
            path: csvw.quoteChar,
            hasValue: '"',
            minCount: 1,
            maxCount: 1,
          }, {
            path: csvw.delimiter,
            hasValue: ',',
            minCount: 1,
            maxCount: 1,
          }],
        },
      },
    })
  })

  it('when updating to incompatible dialect, data get cleared', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('source')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(schema.name, 'Old name')
      .addOut(csvw.dialect, dialect => {
        dialect.addOut(rdf.type, csvw.Dialect)
          .addOut(csvw.quoteChar, '"')
          .addOut(csvw.delimiter, ';')
      })
    const store = new TestResourceStore([
      csvSource,
    ])

    // when
    const changed = await update({
      resource,
      fileStorage,
      store,
    })

    // then
    expect(changed).to.matchShape({
      property: [{
        path: csvw.dialect,
        minCount: 1,
        maxCount: 1,
        node: {
          property: [{
            path: csvw.quoteChar,
            hasValue: '"',
            minCount: 1,
            maxCount: 1,
          }, {
            path: csvw.delimiter,
            hasValue: ';',
            minCount: 1,
            maxCount: 1,
          }],
        },
      },
      {
        path: csvw.column,
        maxCount: 0,
      },
      {
        path: schema.error,
        nodeKind: sh.Literal,
        datatype: xsd.string,
        minCount: 1,
      }],
    })
  })
})
