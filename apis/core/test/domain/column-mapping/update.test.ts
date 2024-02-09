import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, prov, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { DomainError, NotFoundError } from '@cube-creator/api-errors'
import DatasetExt from 'rdf-ext/lib/Dataset'
import * as Organization from '@cube-creator/model/Organization'
import * as Project from '@cube-creator/model/Project'
import { namedNode } from '@cube-creator/testing/clownface'
import { TestResourceStore } from '../../support/TestResourceStore'
import * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import type * as TableQueries from '../../../lib/domain/queries/table'
import '../../../lib/domain'
import { updateLiteralColumnMapping } from '../../../lib/domain/column-mapping/update'
import * as orgQueries from '../../../lib/domain/organization/query'

describe('domain/column-mapping/update', () => {
  let store: TestResourceStore
  const getLinkedTablesForSource = sinon.stub()
  const getTablesForMapping = sinon.stub()
  let tableQueries: typeof TableQueries
  let getTableForColumnMapping: sinon.SinonStub
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>
  let dimensionMappings: GraphPointer<NamedNode, DatasetExt>
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
      .addOut(rdf.type, [cc.ColumnMapping, cc.LiteralColumnMapping])
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const otherColumnMapping = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('otherColumnMapping'))
      .addOut(rdf.type, [cc.ColumnMapping, cc.LiteralColumnMapping])
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column2'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const table = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(cc.columnMapping, columnMapping)
      .addOut(cc.columnMapping, otherColumnMapping)

    columnMappingObservation = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, [cc.ColumnMapping, cc.LiteralColumnMapping])
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)

    const otherColumnMappingObservation = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('otherColumnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-other-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    observationTable = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(cc.columnMapping, columnMappingObservation)
      .addOut(cc.columnMapping, otherColumnMappingObservation)

    const dimensionProperty = $rdf.namedNode('test')

    dimensionMappings = clownface({ dataset: $rdf.dataset() })
      .namedNode('dimension-mappings')
      .addOut(rdf.type, prov.Dictionary)
      .addOut(schema.about, dimensionProperty)

    dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('myDimensionMetadata')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('myDimension'), dim => {
        dim
          .addOut(schema.about, dimensionProperty)
          .addOut(cc.dimensionMapping, dimensionMappings)
      })

    const organization = Organization.fromPointer(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = Project.fromPointer(namedNode('project'), {
      maintainer: organization,
      cubeIdentifier: 'test-cube',
    })

    store = new TestResourceStore([
      table,
      observationTable,
      csvMapping,
      csvSource,
      dimensionMetadata,
      dimensionMappings,
      columnMapping,
      otherColumnMapping,
      columnMappingObservation,
      otherColumnMappingObservation,
      project,
      organization,
    ])

    sinon.restore()
    sinon.stub(DimensionMetadataQueries, 'getDimensionMetaDataCollection').resolves(dimensionMetadata.term)

    getTableForColumnMapping = sinon.stub().resolves(table.term.value)
    tableQueries = {
      getLinkedTablesForSource,
      getTablesForMapping,
      getTableForColumnMapping,
      getTableReferences: sinon.stub(),
      getCubeTable: sinon.stub(),
    }

    sinon.stub(orgQueries, 'findOrganization').resolves({
      projectId: project.id,
      organizationId: organization.id,
    })
  })

  it('updates simple properties', async () => {
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test2'))
      .addOut(cc.datatype, xsd.string)
      .addOut(cc.language, $rdf.literal('de'))
      .addOut(cc.defaultValue, $rdf.literal('test2'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store, tableQueries })

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
        hasValue: $rdf.namedNode('test2'),
        minCount: 1,
      }, {
        path: cc.datatype,
        hasValue: xsd.string,
        minCount: 1,
      }, {
        path: cc.language,
        hasValue: $rdf.literal('de'),
        minCount: 1,
      }, {
        path: cc.defaultValue,
        hasValue: $rdf.literal('test2'),
        minCount: 1,
      }],
    })
  })

  it('delete non mandatory properties', async () => {
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store, tableQueries })

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
        maxCount: 0,
      }, {
        path: cc.language,
        maxCount: 0,
      }, {
        path: cc.defaultValue,
        maxCount: 0,
      }],
    })
  })

  it('changes source column', async () => {
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column2'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store, tableQueries })

    expect(columnMapping.out(cc.sourceColumn).value).to.eq('my-column2')
  })

  it('throw if column does not exit', async () => {
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column3'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const promise = updateLiteralColumnMapping({ resource, store, tableQueries })

    await expect(promise).to.have.rejectedWith(NotFoundError)
  })

  it('throw if targetProperty already in use on observation table', async () => {
    getTableForColumnMapping.resolves(observationTable.term.value)

    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const promise = updateLiteralColumnMapping({ resource, store, tableQueries })

    await expect(promise).to.have.rejectedWith(DomainError)
  })

  it('do not throw if targetProperty already in use on non-observation table', async () => {
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store, tableQueries })

    expect(columnMapping.out(cc.targetProperty).value).to.eq('other')
  })

  it('change targetProperty for obeservation table', async () => {
    getTableForColumnMapping.resolves(observationTable.term.value)

    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test2'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store, tableQueries })

    expect(columnMapping.out(cc.targetProperty).value).to.eq('test2')
    const myDimension = dimensionMetadata.node($rdf.namedNode('myDimension'))
    expect(myDimension).to.matchShape({
      property: {
        path: schema.about,
        minCount: 1,
        maxCount: 1,
        hasValue: $rdf.namedNode('test2'),
      },
    })
    expect(dimensionMappings).to.matchShape({
      property: {
        path: schema.about,
        minCount: 1,
        maxCount: 1,
        hasValue: $rdf.namedNode('test2'),
      },
    })
  })
})
