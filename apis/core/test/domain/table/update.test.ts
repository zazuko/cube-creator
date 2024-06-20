import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import esmock from 'esmock'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { csvw, hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { namedNode } from '@cube-creator/testing/clownface'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import type * as ColumnMappingQueries from '../../../lib/domain/queries/column-mapping.js'
import '../../../lib/domain/index.js'

describe('domain/table/update', () => {
  let store: TestResourceStore
  let columnMappingQueries: typeof ColumnMappingQueries
  let dimensionIsUsedByOtherMapping: sinon.SinonStub
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>
  let columnMapping: GraphPointer<NamedNode, DatasetExt>

  let updateTable: typeof import('../../../lib/domain/table/update.js').updateTable
  let getTableReferences: sinon.SinonStub

  beforeEach(async () => {
    sinon.restore()

    const organization = $rdf.rdfine.cc.Organization(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = $rdf.rdfine.cc.Project(namedNode('project'), {
      maintainer: organization,
      cubeIdentifier: 'test-cube',
    })

    const csvMapping = $rdf.clownface()
      .namedNode('myCsvMapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.tables, $rdf.namedNode('tables'))

    const csvSource = $rdf.clownface()
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('id'), (column) => {
        column.addOut(schema.name, $rdf.literal('id'))
      })
      .addOut(csvw.column, $rdf.namedNode('id2'), (column) => {
        column.addOut(schema.name, $rdf.literal('id2'))
      })

    columnMapping = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    const table = $rdf.clownface()
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMapping)

    const columnMappingObservation = $rdf.clownface()
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('testObservation'))

    const observationTable = $rdf.clownface()
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.columnMapping, columnMappingObservation)

    dimensionMetadata = $rdf.clownface()
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

    sinon.restore()

    dimensionIsUsedByOtherMapping = sinon.stub().resolves(false)
    const getReferencingMappingsForTable = sinon.stub().returns([])
    columnMappingQueries = {
      dimensionIsUsedByOtherMapping,
      getReferencingMappingsForTable,
    }

    getTableReferences = sinon.stub().resolves([])
    ;({ updateTable } = await esmock('../../../lib/domain/table/update.js', {
      '../../lib/domain/organization/query.js': {
        findOrganization: async () =>
          ({
            projectId: project.id,
            organizationId: organization.id,
          }),
        getTableReferences,
      },
      '../../../lib/domain/queries/dimension-metadata.js': {
        getDimensionMetaDataCollection: sinon.stub().resolves(dimensionMetadata.term),
      },
    }))
  })

  it('updates simple properties', async () => {
    // given
    const resource = $rdf.clownface()
      .namedNode('myTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.isObservationTable, false)

    // when
    const table = await updateTable({ resource, store, columnMappingQueries })

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
        hasValue: '{id}',
        minCount: 1,
        maxCount: 1,
      }],
    })
  })

  describe('when identifier template changes', () => {
    let table: GraphPointer

    beforeEach(async () => {
      // given
      const resource = $rdf.clownface()
        .namedNode('myTable')
        .addOut(schema.name, 'the other name')
        .addOut(schema.color, '#bababa')
        .addOut(cc.identifierTemplate, '{id2}')
        .addOut(cc.isObservationTable, false)
      columnMapping
        .addOut(rdf.type, cc.ReferenceColumnMapping)
        .addOut(cc.identifierMapping, mapping => {
          mapping.addOut(cc.sourceColumn, $rdf.namedNode('id'))
          mapping.addOut(cc.referencedColumn, $rdf.namedNode('id'))
        })
      getTableReferences.callsFake(async function * () {
        yield columnMapping.term
      })

      // when
      table = await updateTable({ resource, store, columnMappingQueries })
    })

    it('sets new template', () => {
      expect(table.out(cc.identifierTemplate).value).to.eq('{id2}')
    })

    it('updates reference columns', async () => {
      // then
      const mapping = await store.get(columnMapping.term)
      expect(mapping).to.matchShape({
        property: {
          path: cc.identifierMapping,
          node: {
            property: [{
              path: cc.sourceColumn,
              maxCount: 0,
            }, {
              path: cc.referencedColumn,
              hasValue: $rdf.namedNode('id2'),
              minCount: 1,
              maxCount: 1,
            }],
          },
        },
      })
    })

    it('sets column mapping error', async () => {
      // then
      const mapping = await store.get(columnMapping.term)
      expect(mapping).to.matchShape({
        property: {
          path: schema.error,
          minCount: 1,
          node: {
            property: [{
              path: schema.description,
              minCount: 1,
            }],
          },
        },
      })
    })
  })

  it('define as observation table', async () => {
    // given
    const resource = $rdf.clownface()
      .namedNode('myTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.isObservationTable, true)

    // when
    const table = await updateTable({ resource, store, columnMappingQueries })

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
    const resource = $rdf.clownface()
      .namedNode('myObservationTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.isObservationTable, false)

    // when
    const table = await updateTable({ resource, store, columnMappingQueries })

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
    const resource = $rdf.clownface()
      .namedNode('myObservationTable')
      .addOut(schema.name, 'the other name')
      .addOut(schema.color, '#bababa')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.isObservationTable, false)

    // when
    const table = await updateTable({ resource, store, columnMappingQueries })

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
