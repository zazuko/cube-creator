import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { csvw, dtype, hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import * as Organization from '@cube-creator/model/Organization'
import { namedNode } from '@cube-creator/testing/clownface'
import * as Project from '@cube-creator/model/Project'
import { DomainError } from '@cube-creator/api-errors'
import { createTable } from '../../../lib/domain/table/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import '../../../lib/domain'
import * as TableQueries from '../../../lib/domain/queries/table'
import * as orgQueries from '../../../lib/domain/organization/query'

describe('domain/table/create', () => {
  let store: TestResourceStore
  let tableCollection: GraphPointer<NamedNode, DatasetExt>
  let csvSource: GraphPointer<NamedNode, DatasetExt>
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>
  let getTableQueries: sinon.SinonStub

  beforeEach(() => {
    sinon.restore()

    const organization = Organization.fromPointer(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = Project.fromPointer(namedNode('project'), {
      maintainer: organization,
      cubeIdentifier: 'test-cube',
    })
    const csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('myCsvMapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.tables, $rdf.namedNode('tables'))
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
      project,
      organization,
    ])

    sinon.restore()
    sinon.stub(DimensionMetadataQueries, 'getDimensionMetaDataCollection').resolves(dimensionMetadata.term)
    getTableQueries = sinon.stub(TableQueries, 'getCubeTable').resolves(undefined)

    sinon.stub(orgQueries, 'findOrganization').resolves({
      projectId: project.id,
      organizationId: organization.id,
    })
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
    const table = await createTable({ resource, store, tableCollection })

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
    const table = await createTable({ resource, store, tableCollection })

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
    const table = await createTable({ resource, store, tableCollection })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.ObservationTable,
        minCount: 1,
      }],
    })
  })

  it('does not allow multiple Cube Tables', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.isObservationTable, true)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
    getTableQueries.resolves([$rdf.namedNode('cube-table')])

    // then
    await expect(createTable(
      {
        resource,
        store,
        tableCollection,
      }),
    ).to.eventually.be.rejectedWith(DomainError)
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
    const table = await createTable({ resource, store, tableCollection })
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

  it('allows concept table columns to have same name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column'))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column'))

    // when
    const table = await createTable({ resource, store, tableCollection })

    // then
    expect(table).to.be.ok
  })

  it('does not allow cube table columns to have same name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(cc.isObservationTable, true)
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column'))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column'))

    // when
    const promiseToCreateTable = createTable({ resource, store, tableCollection })

    // then
    await expect(promiseToCreateTable).to.have.eventually.rejected
  })

  it('does not allow cube table columns to have same name, generated from CSV columns with special characters', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(cc.isObservationTable, true)
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'Bewegungen LFZ >= 8.6 To'))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'Bewegungen LFZ < 8.6 To'))

    // when
    const promiseToCreateTable = createTable({ resource, store, tableCollection })

    // then
    await expect(promiseToCreateTable).to.have.eventually.rejected
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
    const table = await createTable({ resource, store, tableCollection })
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
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-3'), column => column.addOut(schema.name, 'column 3').addOut(dtype.order, 1))

    // when
    const table = await createTable({ resource, store, tableCollection })

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
    await createTable({ resource, store, tableCollection })

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
    await createTable({ resource, store, tableCollection })

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
