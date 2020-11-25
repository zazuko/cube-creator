import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, rdf, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { TestResourceStore } from '../../support/TestResourceStore'
import type * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import type * as TableQueries from '../../../lib/domain/queries/table'
import '../../../lib/domain'
import { NotFoundError } from '../../../lib/errors'
import { NamedNode } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { deleteColumnMapping } from '../../../lib/domain/column-mapping/delete'

describe('domain/column-mapping/delete', () => {
  let store: TestResourceStore
  let dimensionMetadataQueries: typeof DimensionMetadataQueries
  let getDimensionMetaDataCollection: sinon.SinonStub
  const getLinkedTablesForSource = sinon.stub()
  const getTablesForMapping = sinon.stub()
  let tableQueries: typeof TableQueries
  let getTableForColumnMapping: sinon.SinonStub
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>
  let columnMapping: GraphPointer<NamedNode, DatasetExt>
  let columnMappingObservation: GraphPointer<NamedNode, DatasetExt>
  let observationTable: GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    const csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('csv-mapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.namespace, 'http://example.com/')
    const csvSource = clownface({ dataset: $rdf.dataset() })
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column'))
      })
      .addOut(csvw.column, $rdf.namedNode('my-column2'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column 2'))
      })

    columnMapping = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const otherColumnMapping = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('otherColumnMapping'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column2'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const table = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(cc.columnMapping, columnMapping)
      .addOut(cc.columnMapping, otherColumnMapping)

    columnMappingObservation = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)

    observationTable = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(cc.columnMapping, columnMappingObservation)

    dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('myDimensionMetadata')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('myDimension'), dim => {
        dim.addOut(schema.about, $rdf.namedNode('test'))
      })

    store = new TestResourceStore([
      table,
      observationTable,
      csvMapping,
      csvSource,
      dimensionMetadata,
      columnMapping,
      otherColumnMapping,
      columnMappingObservation,
    ])

    getDimensionMetaDataCollection = sinon.stub().resolves(dimensionMetadata.term.value)
    dimensionMetadataQueries = { getDimensionMetaDataCollection }
    getTableForColumnMapping = sinon.stub().resolves(table.term.value)
    tableQueries = {
      getLinkedTablesForSource,
      getTablesForMapping,
      getTableForColumnMapping,
    }
  })

  it('deletes a column mapping and its dimensions', async () => {
    const resource = $rdf.namedNode('columnMapping')

    const before = await store.getResource($rdf.namedNode('myDimensionMetadata'))
    expect(before?.toJSON().hasPart[0].id).to.eq('myDimension')

    const columnMapping = deleteColumnMapping({ resource, store, dimensionMetadataQueries, tableQueries })

    const after = await store.getResource($rdf.namedNode('myDimensionMetadata'))
    expect(after?.toJSON().hasPart[0].id).not.to.eq('myDimension')

    expect(columnMapping).to.be.fulfilled
  })

  it('throw if column mapping does not exit', async () => {
    const resource = $rdf.namedNode('columnMapping-foo')
    const promise = deleteColumnMapping({ resource, store, dimensionMetadataQueries, tableQueries })

    await expect(promise).to.have.rejectedWith(NotFoundError)
  })
})
