import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import clownface from 'clownface'
import { TestResourceStore } from '../../support/TestResourceStore'
import * as TableQueries from '../../../lib/domain/queries/table'
import '../../../lib/domain'
import { deleteSource } from '../../../lib/domain/csv-source/delete'
import * as DeleteTable from '../../../lib/domain/table/delete'
import type { GetMediaStorage, MediaStorage } from '../../../lib/storage'

describe('domain/csv-sources/delete', () => {
  let storage: MediaStorage
  let getStorage: GetMediaStorage

  beforeEach(() => {
    storage = {
      getStream: sinon.spy(),
      delete: sinon.spy(),
      getDownloadLink: sinon.spy(),
    }
    getStorage = () => (storage)

    async function * tableGenerator() {
      yield $rdf.namedNode('table')
    }

    sinon.restore()
    sinon.stub(TableQueries, 'getLinkedTablesForSource').returns(tableGenerator())
    sinon.stub(TableQueries, 'getTablesForMapping').returns(tableGenerator())
    sinon.stub(TableQueries, 'getTableForColumnMapping')

    sinon.stub(DeleteTable, 'deleteTable')
  })
  const csvSource = clownface({ dataset: $rdf.dataset() })
    .namedNode('source')
    .addOut(rdf.type, cc.CSVSource)
    .addOut(schema.associatedMedia, file => { file.addOut(schema.identifier, 'FileKey') })
    .addOut(cc.csvMapping, $rdf.namedNode('csv-mapping'))
  const csvMapping = clownface({ dataset: $rdf.dataset() })
    .namedNode('csv-mapping')
    .addOut(rdf.type, cc.CsvMapping)
    .addOut(cc.csvSource, csvSource)
  const table = clownface({ dataset: $rdf.dataset() })
    .namedNode('table')
    .addOut(rdf.type, cc.Table)
    .addOut(cc.csvSource, csvSource)

  it('everything is deleted', async () => {
    // given
    const store = new TestResourceStore([csvMapping,
      csvSource, table,
    ])
    // when
    await deleteSource({ resource: csvSource.term, store: store, getStorage })

    // then
    expect(storage.delete).to.have.been.calledWith(sinon.match({
      id: csvSource.out(schema.associatedMedia).term,
    }))
    expect(csvMapping.out(cc.csvSource).term).to.be.undefined
    expect(DeleteTable.deleteTable).to.have.been.calledWith(sinon.match({
      resource: table.term,
    }))
  })
})
