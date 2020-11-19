import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { createColumnMapping } from '../../../lib/domain/column-mapping/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import type * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import '../../../lib/domain'

describe('domain/column-mapping/create', () => {
  let store: TestResourceStore
  let dimensionMetadataQueries: typeof DimensionMetadataQueries
  let getDimensionMetaDataCollection: sinon.SinonStub
  const table = clownface({ dataset: $rdf.dataset() })
    .namedNode('myTable')
    .addOut(rdf.type, cc.Table)
    .addOut(cc.csvMapping, $rdf.namedNode('myMapping'))
  const observationTable = clownface({ dataset: $rdf.dataset() })
    .namedNode('myObservationTable')
    .addOut(rdf.type, cc.Table)
    .addOut(rdf.type, cc.ObservationTable)
    .addOut(cc.csvMapping, $rdf.namedNode('myMapping'))
  const csvMapping = clownface({ dataset: $rdf.dataset() })
    .namedNode('myMapping')
    .addOut(rdf.type, cc.CsvMapping)
    .addOut(cc.namespace, $rdf.namedNode('http://example.com'))
  const csvSource = clownface({ dataset: $rdf.dataset() })
    .namedNode('foo')
    .addOut(rdf.type, cc.CSVSource)
    .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
      column.addOut(schema.name, $rdf.literal('My Column'))
    })
  table.addOut(cc.csvSource, csvSource.term)
  observationTable.addOut(cc.csvSource, csvSource.term)
  const dimensionMetadata = clownface({ dataset: $rdf.dataset() })
    .namedNode('myDimensionMetadata')
    .addOut(rdf.type, cc.DimensionMetadataCollection)

  beforeEach(() => {
    store = new TestResourceStore([
      table,
      observationTable,
      csvMapping,
      csvSource,
      dimensionMetadata,

    ])

    getDimensionMetaDataCollection = sinon.stub().resolves(dimensionMetadata.term.value)
    dimensionMetadataQueries = { getDimensionMetaDataCollection }
  })

  it('creates identifier by slugifying the column schema:name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, 'test')

    // when
    const columnMapping = await createColumnMapping({ resource, store, tableId: table.term, dimensionMetadataQueries })

    // then
    expect(columnMapping.term.value).to.match(/\/my-column-(.+)$/)
  })

  it('creates correctly shaped cc:ColumnMapping', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    // when
    const columnMapping = await createColumnMapping({ resource, store, tableId: table.term, dimensionMetadataQueries })

    // then
    expect(columnMapping).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [cc.ColumnMapping, hydra.Resource],
        minCount: 2,
      }, {
        path: cc.sourceColumn,
        hasValue: $rdf.namedNode('my-column'),
        minCount: 1,
      }, {
        path: cc.targetProperty,
        hasValue: $rdf.namedNode('test'),
        minCount: 1,
      }, {
        path: cc.datatype,
        hasValue: xsd.integer,
        minCount: 1,
      }, {
        path: cc.language,
        hasValue: $rdf.literal('fr'),
        minCount: 1,
      }, {
        path: cc.defaultValue,
        hasValue: $rdf.literal('test'),
        minCount: 1,
      }],
    })
  })

  it('links column mapping from table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    // when
    const columnMapping = await createColumnMapping({ resource, store, tableId: table.term, dimensionMetadataQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: cc.columnMapping,
        [sh.hasValue.value]: columnMapping.term,
        minCount: 1,
      }],
    })
  })

  it('No metadata when not observation table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    // when
    await createColumnMapping({ resource, store, tableId: table.term, dimensionMetadataQueries })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: {
        path: schema.hasPart,
        maxCount: 0,
      },
    })
  })

  it('creates Dimension Metadata for column', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    // when
    await createColumnMapping({ resource, store, tableId: observationTable.term, dimensionMetadataQueries })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: {
        path: schema.hasPart,
        minCount: 1,
        node: {
          property: {
            path: schema.about,
            minCount: 1,
            maxCount: 1,
          },
        },
      },
    })
  })

  it('throw if same dimension metadata with same targetProperty is added twice', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
    await createColumnMapping({ resource, store, tableId: observationTable.term, dimensionMetadataQueries })

    // then
    expect(createColumnMapping({ resource, store, tableId: observationTable.term, dimensionMetadataQueries })).to.rejectedWith(Error)
  })
})
