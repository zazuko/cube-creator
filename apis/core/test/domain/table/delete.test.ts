import { NamedNode } from 'rdf-js'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { csvw, hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ColumnMapping, Table } from '@cube-creator/model'
import * as Organization from '@cube-creator/model/Organization'
import { namedNode } from '@cube-creator/testing/clownface'
import * as Project from '@cube-creator/model/Project'
import { TestResourceStore } from '../../support/TestResourceStore'
import * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import type * as TableQueries from '../../../lib/domain/queries/table'
import type * as ColumnMappingQueries from '../../../lib/domain/queries/column-mapping'
import '../../../lib/domain'
import { deleteTable } from '../../../lib/domain/table/delete'
import * as orgQueries from '../../../lib/domain/organization/query'

describe('domain/table/delete', () => {
  let store: TestResourceStore
  let getReferencingMappingsForTable: sinon.SinonStub
  const getLinkedTablesForSource = sinon.stub()
  const getTablesForMapping = sinon.stub()
  let tableQueries: typeof TableQueries
  let columnMappingQueries: typeof ColumnMappingQueries
  let dimensionIsUsedByOtherMapping: sinon.SinonStub
  let columnMapping : GraphPointer<NamedNode, DatasetExt>
  let columnMappingReferencing : GraphPointer<NamedNode, DatasetExt>
  let table : GraphPointer<NamedNode, DatasetExt>
  let columnMappingObservation : GraphPointer<NamedNode, DatasetExt>
  let observationTable : GraphPointer<NamedNode, DatasetExt>
  let dimensionMetadataCollection : GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    sinon.restore()

    const organization = Organization.fromPointer(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = Project.fromPointer(namedNode('project'), {
      maintainer: organization,
    })

    const csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('myCsvMapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.tables, $rdf.namedNode('tables'))

    const csvSource = clownface({ dataset: $rdf.dataset() })
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column'))
      })

    columnMapping = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('referencingColumnMapping'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    columnMappingReferencing = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(rdf.type, cc.ReferenceColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.referencedTable, $rdf.namedNode('myTable'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    table = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMapping)

    columnMappingObservation = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('testObservation'))

    observationTable = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMappingObservation)

    dimensionMetadataCollection = clownface({ dataset: $rdf.dataset() })
      .namedNode('dimensionMetadataCollection')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('myDimension'), dim => {
        dim.addOut(schema.about, $rdf.namedNode('testObservation'))
      })

    store = new TestResourceStore([
      csvSource,
      csvMapping,
      columnMapping,
      table,
      columnMappingObservation,
      observationTable,
      dimensionMetadataCollection,
      project,
      organization,
      columnMappingReferencing,
    ])

    sinon.restore()
    sinon.stub(DimensionMetadataQueries, 'getDimensionMetaDataCollection').resolves(dimensionMetadataCollection.term)

    const getTableForColumnMapping = sinon.stub().resolves(observationTable.term.value)
    tableQueries = {
      getLinkedTablesForSource,
      getTablesForMapping,
      getTableForColumnMapping,
      getTableReferences: sinon.stub(),
    }

    dimensionIsUsedByOtherMapping = sinon.stub().resolves(false)
    getReferencingMappingsForTable = sinon.stub().returns([])
    columnMappingQueries = {
      dimensionIsUsedByOtherMapping,
      getReferencingMappingsForTable,
    }

    sinon.stub(orgQueries, 'findOrganization').resolves({
      projectId: project.id,
      organizationId: organization.id,
    })
  })

  it('deletes the table', async () => {
    // given

    // when
    await deleteTable({ resource: table.term, store, tableQueries, columnMappingQueries })
    await store.save()

    // then
    const deletedTable = await store.getResource<Table>(table.term, { allowMissing: true })
    expect(deletedTable).to.eq(undefined)

    const deletedColumnMapping = await store.getResource<ColumnMapping>(columnMapping.term, { allowMissing: true })
    expect(deletedColumnMapping).to.eq(undefined)
  })

  it('deletes the observation table', async () => {
    // given

    // when
    await deleteTable({ resource: observationTable.term, store, tableQueries, columnMappingQueries })
    await store.save()

    // then
    const deletedTable = await store.getResource<Table>(observationTable.term, { allowMissing: true })
    expect(deletedTable).to.eq(undefined)

    const deletedColumnMapping = await store.getResource<ColumnMapping>(columnMappingObservation.term, { allowMissing: true })
    expect(deletedColumnMapping).to.eq(undefined)

    expect(dimensionMetadataCollection.out(schema.hasPart).values.length).to.eq(0)
  })

  it('deletes the observation table but not the used dimensions', async () => {
    // given
    dimensionIsUsedByOtherMapping.resolves(true)

    // when
    await deleteTable({ resource: observationTable.term, store, tableQueries, columnMappingQueries })
    await store.save()

    // then
    const deletedTable = await store.getResource<Table>(observationTable.term, { allowMissing: true })
    expect(deletedTable).to.eq(undefined)

    const deletedColumnMapping = await store.getResource<ColumnMapping>(columnMappingObservation.term, { allowMissing: true })
    expect(deletedColumnMapping).to.eq(undefined)

    expect(dimensionMetadataCollection.out(schema.hasPart).values.length).to.eq(1)
  })

  it('deletes referenced mappings', async () => {
    // given
    async function * mappingGenerator() {
      yield columnMappingReferencing.term
    }

    getReferencingMappingsForTable.returns(mappingGenerator())

    // when
    await deleteTable({ resource: table.term, store, tableQueries, columnMappingQueries })
    await store.save()

    // then
    const deletedColumnMapping = await store.getResource<ColumnMapping>(columnMappingReferencing.term, { allowMissing: true })
    expect(deletedColumnMapping).to.eq(undefined)
  })
})
