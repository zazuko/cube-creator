import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { csvw, dtype, hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { createTable } from '../../../lib/domain/table/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import { NamedNode } from 'rdf-js'
import type * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import '../../../lib/domain'

describe('domain/table/create', () => {
  let store: TestResourceStore
  let dimensionMetadataQueries: typeof DimensionMetadataQueries
  let getDimensionMetaDataCollection: sinon.SinonStub
  let tableCollection: GraphPointer<NamedNode, DatasetExt>
  let csvSource: GraphPointer<NamedNode, DatasetExt>
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    const csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('myCsvMapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.tables, $rdf.namedNode('tables'))
      .addOut(cc.namespace, 'http://example.com/')
    tableCollection = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('tables') })
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
    csvSource = clownface({ dataset: $rdf.dataset() })
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
    dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('myDimensionMetadata')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
    store = new TestResourceStore([
      tableCollection,
      csvSource,
      csvMapping,
      dimensionMetadata,
    ])

    getDimensionMetaDataCollection = sinon.stub().resolves(dimensionMetadata.term.value)
    dimensionMetadataQueries = { getDimensionMetaDataCollection }
  })

  it('creates identifier by slugifying schema:name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#aaa')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(cc.identifierTemplate, '{id}')

    // when
    const table = await createTable({ resource, store, tableCollection, dimensionMetadataQueries })

    // then
    expect(table.out(schema.name).value).to.eq('the name')
    expect(table.term.value).to.match(/myCsvMapping\/table\/the-name-(.+)$/)
    expect(table.out(schema.color).term!.value).to.eq('#aaa')
  })

  it('creates correctly shaped cc:Table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))

    // when
    const table = await createTable({ resource, store, tableCollection, dimensionMetadataQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [cc.Table, hydra.Resource],
        minCount: 2,
      }, {
        path: cc.csvw,
        pattern: 'myCsvMapping/table/the-name-(.+)/csvw$',
        minCount: 1,
        maxCount: 1,
      }, {
        path: cc.csvMapping,
        hasValue: $rdf.namedNode('myCsvMapping'),
        minCount: 1,
      }, {
        path: cc.identifierTemplate,
        hasValue: '{id}',
        minCount: 1,
      }],
    })
  })

  it('creates cc:ObservationTable if flagged', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.isObservationTable, true)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))

    // when
    const table = await createTable({ resource, store, tableCollection, dimensionMetadataQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.ObservationTable,
        minCount: 1,
      }],
    })
  })

  it('creates a ColumnMapping resources for selected source columns', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column 1'))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column 2'))

    // when
    const table = await createTable({ resource, store, tableCollection, dimensionMetadataQueries })
    const column = await store.get(table.out(cc.columnMapping).terms[0] as NamedNode)

    // then
    expect(table.out(cc.columnMapping).terms).to.have.length(2)
    expect(column).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.ColumnMapping,
        minCount: 1,
      }, {
        path: cc.sourceColumn,
        minCount: 1,
        maxCount: 1,
      }, {
        path: cc.targetProperty,
        minCount: 1,
        maxCount: 1,
      }],
    })
  })

  it('turns column names into URL-safe slugs', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, $rdf.namedNode('source-column-1'))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'Column 1'))

    // when
    const table = await createTable({ resource, store, tableCollection, dimensionMetadataQueries })
    const column = await store.get(table.out(cc.columnMapping).terms[0] as NamedNode)

    // then
    expect(column).to.matchShape({
      property: {
        path: cc.targetProperty,
        hasValue: 'column-1',
        minCount: 1,
        maxCount: 1,
      },
    })
  })

  it('generates template if missing', async () => {
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#aaa')
      .addOut(cc.identifierTemplate, '')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column 1').addOut(dtype.order, 0))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column 2').addOut(dtype.order, 1))

    // when
    const table = await createTable({ resource, store, tableCollection, dimensionMetadataQueries })

    // then
    expect(table.out(cc.identifierTemplate).value).to.eq('{column 1}/{column 2}')
  })

  it('no dimension metadata when not observation table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#aaa')
      .addOut(cc.identifierTemplate, '')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column 1').addOut(dtype.order, 0))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column 2').addOut(dtype.order, 1))

    // when
    await createTable({ resource, store, tableCollection, dimensionMetadataQueries })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: [{
        path: schema.hasPart,
        maxCount: 0,
      }],
    })
  })

  it('creates Dimension Metadata for observation table columns ', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(cc.isObservationTable, true)
      .addOut(schema.color, '#aaa')
      .addOut(cc.identifierTemplate, '')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column 1').addOut(dtype.order, 0))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column 2').addOut(dtype.order, 1))

    // when
    await createTable({ resource, store, tableCollection, dimensionMetadataQueries })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: [{
        path: schema.hasPart,
        minCount: 2,
        maxCount: 2,
        node: {
          property: {
            path: schema.about,
            minCount: 1,
            maxCount: 1,
          },
        },
      }],
    })
  })
})
