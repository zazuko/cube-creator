import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from '@zazuko/env'
import { cc } from '@cube-creator/core/namespace'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import esmock from 'esmock'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import type { GetMediaStorage, MediaStorage } from '../../../lib/storage/index.js'
import '../../../lib/domain/index.js'

describe('domain/csv-sources/delete', () => {
  let storage: MediaStorage
  let getStorage: GetMediaStorage
  let deleteTable: sinon.SinonStub

  let deleteSource: typeof import('../../../lib/domain/csv-source/delete.js').deleteSource

  beforeEach(async () => {
    storage = {
      getStream: sinon.spy(),
      delete: sinon.spy(),
      getDownloadLink: sinon.spy(),
    }
    getStorage = () => (storage)

    async function * tableGenerator() {
      yield $rdf.namedNode('table')
    }

    deleteTable = sinon.stub()
    ;({ deleteSource } = await esmock('../../../lib/domain/csv-source/delete.js', {
      '../../../lib/domain/queries/table.js': {
        getLinkedTablesForSource: sinon.stub().returns(tableGenerator()),
        getTablesForMapping: sinon.stub().returns(tableGenerator()),
        getTableForColumnMapping: sinon.stub(),
      },
      '../../../lib/domain/table/delete.js': {
        deleteTable,
      },
    }))
  })
  const csvSource = $rdf.clownface()
    .namedNode('source')
    .addOut(rdf.type, cc.CSVSource)
    .addOut(schema.associatedMedia, file => { file.addOut(schema.identifier, 'FileKey') })
    .addOut(cc.csvMapping, $rdf.namedNode('csv-mapping'))
  const csvMapping = $rdf.clownface()
    .namedNode('csv-mapping')
    .addOut(rdf.type, cc.CsvMapping)
    .addOut(cc.csvSource, csvSource)
  const table = $rdf.clownface()
    .namedNode('table')
    .addOut(rdf.type, cc.Table)
    .addOut(cc.csvSource, csvSource)

  it('everything is deleted', async () => {
    // given
    const store = new TestResourceStore([csvMapping,
      csvSource, table,
    ])
    // when
    await deleteSource({ resource: csvSource.term, store, getStorage })

    // then
    expect(storage.delete).to.have.been.calledWith(sinon.match({
      id: csvSource.out(schema.associatedMedia).term,
    }))
    expect(csvMapping.out(cc.csvSource).term).to.be.undefined
    expect(deleteTable).to.have.been.calledWith(sinon.match({
      resource: table.term,
    }))
  })
})
