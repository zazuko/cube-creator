import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, rdf, schema, xsd, prov } from '@tpluscode/rdf-ns-builders/strict'
import { cc } from '@cube-creator/core/namespace'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { ColumnMapping } from '@cube-creator/model'
import * as Organization from '@cube-creator/model/Organization'
import * as Project from '@cube-creator/model/Project'
import { namedNode } from '@cube-creator/testing/clownface'
import { TestResourceStore } from '../../support/TestResourceStore'
import * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import type * as TableQueries from '../../../lib/domain/queries/table'
import type * as ColumnMappingQueries from '../../../lib/domain/queries/column-mapping'
import '../../../lib/domain'
import { deleteColumnMapping } from '../../../lib/domain/column-mapping/delete'
import * as orgQueries from '../../../lib/domain/organization/query'

describe('domain/column-mapping/delete', () => {
  let store: TestResourceStore
  const getLinkedTablesForSource = sinon.stub()
  const getTablesForMapping = sinon.stub()
  let tableQueries: typeof TableQueries
  let getTableForColumnMapping: sinon.SinonStub
  let columnMappingQueries: typeof ColumnMappingQueries
  let dimensionIsUsedByOtherMapping: sinon.SinonStub
  let dimensionMetadataCollection: GraphPointer<NamedNode, DatasetExt>
  let columnMapping: GraphPointer<NamedNode, DatasetExt>
  let columnMappingObservation: GraphPointer<NamedNode, DatasetExt>
  let observationTable: GraphPointer<NamedNode, DatasetExt>
  let dimensionMapping: GraphPointer<NamedNode, DatasetExt>

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
      .namedNode('csv-mapping')
      .addOut(rdf.type, cc.CsvMapping)
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
      .addOut(cc.columnMapping, columnMapping)

    dimensionMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('myDimensionMapping')
      .addOut(rdf.type, prov.Dictionary)

    dimensionMetadataCollection = clownface({ dataset: $rdf.dataset() })
      .namedNode('dimensionMetadataCollection')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('myDimension'), dim => {
        dim.addOut(schema.about, $rdf.namedNode('test'))
          .addOut(cc.dimensionMapping, dimensionMapping)
      })
      .addOut(schema.hasPart, $rdf.namedNode('myDimension2'), dim => {
        dim.addOut(schema.about, $rdf.namedNode('test2'))
      })

    store = new TestResourceStore([
      table,
      observationTable,
      csvMapping,
      csvSource,
      dimensionMetadataCollection,
      columnMapping,
      otherColumnMapping,
      columnMappingObservation,
      project,
      organization,
      dimensionMapping,
    ])

    sinon.restore()
    sinon.stub(DimensionMetadataQueries, 'getDimensionMetaDataCollection').resolves(dimensionMetadataCollection.term)

    getTableForColumnMapping = sinon.stub().resolves(observationTable.term.value)
    tableQueries = {
      getLinkedTablesForSource,
      getTablesForMapping,
      getTableForColumnMapping,
      getTableReferences: sinon.stub(),
      getCubeTable: sinon.stub(),
    }

    dimensionIsUsedByOtherMapping = sinon.stub().resolves(false)
    const getReferencingMappingsForTable = sinon.stub().returns([])
    columnMappingQueries = {
      dimensionIsUsedByOtherMapping,
      getReferencingMappingsForTable,
    }

    sinon.stub(orgQueries, 'findOrganization').resolves({
      projectId: project.id,
      organizationId: organization.id,
    })
  })

  it('deletes a column mapping and its dimensions', async () => {
    const resourceId = $rdf.namedNode('columnMappingObservation')

    const dimensionsCount = dimensionMetadataCollection.out(schema.hasPart).terms.length
    const columnMappingsCount = observationTable.out(cc.columnMapping).terms.length

    await deleteColumnMapping({ resource: resourceId, store, tableQueries, columnMappingQueries })
    await store.save()

    const columnMapping = await store.getResource<ColumnMapping>(resourceId, { allowMissing: true })
    expect(columnMapping).to.eq(undefined)

    expect(dimensionMetadataCollection.out(schema.hasPart).terms).to.have.length(dimensionsCount - 1)
    expect(observationTable.out(cc.columnMapping).terms).to.have.length(columnMappingsCount - 1)
    expect(dimensionMetadataCollection.node($rdf.namedNode('myDimension')).out().values).to.be.empty
  })

  it('deletes a column mapping but not dimension stays untouched since shared', async () => {
    dimensionIsUsedByOtherMapping.resolves(true)

    const resourceId = $rdf.namedNode('columnMappingObservation')

    const dimensionsCount = dimensionMetadataCollection.out(schema.hasPart).terms.length
    const columnMappingsCount = observationTable.out(cc.columnMapping).terms.length
    const dimensionMetadataCount = dimensionMetadataCollection.node($rdf.namedNode('myDimension')).out().values.length

    await deleteColumnMapping({ resource: resourceId, store, tableQueries, columnMappingQueries })
    await store.save()

    const columnMapping = await store.getResource<ColumnMapping>(resourceId, { allowMissing: true })
    expect(columnMapping).to.eq(undefined)

    expect(dimensionMetadataCollection.out(schema.hasPart).terms).to.have.length(dimensionsCount)
    expect(observationTable.out(cc.columnMapping).terms).to.have.length(columnMappingsCount - 1)
    expect(dimensionMetadataCollection.node($rdf.namedNode('myDimension')).out().values).to.have.length(dimensionMetadataCount)
  })

  it('deletes dimension mapping', async () => {
    // give
    const resourceId = $rdf.namedNode('columnMappingObservation')

    // when
    await deleteColumnMapping({ resource: resourceId, store, tableQueries, columnMappingQueries })
    await store.save()

    // then
    const resource = await store.get(dimensionMapping.term, { allowMissing: true })
    expect(resource).to.be.undefined
  })
})
