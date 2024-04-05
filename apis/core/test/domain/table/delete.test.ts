import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { csvw, hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ColumnMapping, Table } from '@cube-creator/model'
import { namedNode } from '@cube-creator/testing/clownface'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata.js'
import type * as TableQueries from '../../../lib/domain/queries/table.js'
import type * as ColumnMappingQueries from '../../../lib/domain/queries/column-mapping.js'
import { deleteTable } from '../../../lib/domain/table/delete.js'
import * as orgQueries from '../../../lib/domain/organization/query.js'
import '../../../lib/domain/index.js'

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

    const organization = $rdf.rdfine.cc.Organization(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = $rdf.rdfine.cc.Project(namedNode('project'), {
      maintainer: organization,
    })

    const csvMapping = $rdf.clownface()
      .namedNode('myCsvMapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.tables, $rdf.namedNode('tables'))

    const csvSource = $rdf.clownface()
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column'))
      })

    columnMapping = $rdf.clownface()
      .node($rdf.namedNode('referencingColumnMapping'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    columnMappingReferencing = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(rdf.type, cc.ReferenceColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.referencedTable, $rdf.namedNode('myTable'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    table = $rdf.clownface()
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMapping)

    columnMappingObservation = $rdf.clownface()
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('testObservation'))

    observationTable = $rdf.clownface()
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMappingObservation)

    dimensionMetadataCollection = $rdf.clownface()
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
      getCubeTable: sinon.stub(),
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
