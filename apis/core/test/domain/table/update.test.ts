import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { csvw, hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { TestResourceStore } from '../../support/TestResourceStore'
import { NamedNode } from 'rdf-js'
import type * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import type * as ColumnMappingQueries from '../../../lib/domain/queries/column-mapping'
import '../../../lib/domain'
import { updateTable } from '../../../lib/domain/table/update'
import * as orgQueries from '../../../lib/domain/organization/query'
import * as Organization from '@cube-creator/model/Organization'
import { namedNode } from '@cube-creator/testing/clownface'
import * as Project from '@cube-creator/model/Project'

describe('domain/table/update', () => {
  let store: TestResourceStore
  let dimensionMetadataQueries: typeof DimensionMetadataQueries
  let getDimensionMetaDataCollection: sinon.SinonStub
  let columnMappingQueries: typeof ColumnMappingQueries
  let dimensionIsUsedByOtherMapping: sinon.SinonStub
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>

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

    const csvSource = clownface({ dataset: $rdf.dataset() })
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column'))
      })

    const columnMapping = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMapping'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    const table = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMapping)

    const columnMappingObservation = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('testObservation'))

    const observationTable = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMappingObservation)

    dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('myDimensionMetadata')
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
      dimensionMetadata,
      project,
      organization,
    ])

    getDimensionMetaDataCollection = sinon.stub().resolves(dimensionMetadata.term.value)
    dimensionMetadataQueries = { getDimensionMetaDataCollection }

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

  it('updates simple properties', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id2}')
      .addOut(cc.isObservationTable, false)

    // when
    const table = await updateTable({ resource, store, dimensionMetadataQueries, columnMappingQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: schema.name,
        pattern: 'the other name',
        minCount: 1,
        maxCount: 1,
      }, {
        path: schema.color,
        pattern: '#bababa',
        minCount: 1,
        maxCount: 1,
      }, {
        path: cc.identifierTemplate,
        hasValue: '{id2}',
        minCount: 1,
        maxCount: 1,
      }],
    })
  })

  it('define as observation table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id2}')
      .addOut(cc.isObservationTable, true)

    // when
    const table = await updateTable({ resource, store, dimensionMetadataQueries, columnMappingQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.ObservationTable,
        minCount: 1,
      }],
    })

    expect(dimensionMetadata).to.matchShape({
      property: [{
        path: schema.hasPart,
        minCount: 2,
        maxCount: 2,
      }],
    })

    const dimension = dimensionMetadata.node($rdf.namedNode('myDimensionMetadata/test'))
    expect(dimension).to.matchShape({
      property: {
        path: schema.about,
        minCount: 1,
        maxCount: 1,
        hasValue: $rdf.namedNode('test'),
      },
    })
  })

  it('is not an observation table anymore', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.isObservationTable, false)

    // when
    const table = await updateTable({ resource, store, dimensionMetadataQueries, columnMappingQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.Table,
        maxCount: 1,
        minCount: 1,
      }],
    })

    expect(dimensionMetadata).to.matchShape({
      property: [{
        path: schema.hasPart,
        minCount: 0,
        maxCount: 0,
      }],
    })
  })

  it('is not an observation table anymore but shared dimension', async () => {
    // given
    dimensionIsUsedByOtherMapping.resolves(true)
    const resource = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.isObservationTable, false)

    // when
    const table = await updateTable({ resource, store, dimensionMetadataQueries, columnMappingQueries })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.Table,
        maxCount: 1,
        minCount: 1,
      }],
    })

    expect(dimensionMetadata).to.matchShape({
      property: [{
        path: schema.hasPart,
        minCount: 1,
        maxCount: 1,
      }],
    })
  })
})
