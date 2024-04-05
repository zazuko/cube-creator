import * as fs from 'fs'
import * as path from 'path'
import { Readable } from 'stream'
import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { csvw, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import type { GraphPointer } from 'clownface'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import '../../../lib/domain/index.js'
import { update } from '../../../lib/domain/csv-source/update.js'
import type { GetMediaStorage, MediaStorage } from '../../../lib/storage/index.js'

describe('domain/csv-sources/upload', () => {
  let storage: MediaStorage
  let getStorage: GetMediaStorage
  let csvSource: GraphPointer<NamedNode, DatasetExt>
  let fileStream: Readable

  beforeEach(() => {
    fileStream = fs.createReadStream(path.resolve(__dirname, '../../../../../minio/cube-creator/test-data/ubd28/input_CH_yearly_air_immission_basetable.csv'))
    storage = {
      getStream: sinon.stub().callsFake(() => fileStream),
      delete: sinon.spy(),
      getDownloadLink: sinon.spy(),
    }
    getStorage = () => (storage)
    csvSource = $rdf.clownface()
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
    const resource = $rdf.clownface()
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
      getStorage,
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
    const resource = $rdf.clownface()
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
      getStorage,
      store,
    })

    // then
    expect(storage.getStream).not.called
  })

  it('loads the source file when dialect changes', async () => {
    // given
    const resource = $rdf.clownface()
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
      getStorage,
      store,
    })

    // then
    expect(storage.getStream).to.have.been.calledOnce
  })

  it('it updates dialect when necessary', async () => {
    // given
    const resource = $rdf.clownface()
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
      getStorage,
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
    const resource = $rdf.clownface()
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
      getStorage,
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
