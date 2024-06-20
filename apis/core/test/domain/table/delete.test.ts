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
import esmock from 'esmock'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import '../../../lib/domain/index.js'

describe('domain/table/delete', () => {
  let store: TestResourceStore
  let getReferencingMappingsForTable: sinon.SinonStub
  const getLinkedTablesForSource = sinon.stub()
  const getTablesForMapping = sinon.stub()
  let dimensionIsUsedByOtherMapping: sinon.SinonStub
  let columnMapping : GraphPointer<NamedNode, DatasetExt>
  let columnMappingReferencing : GraphPointer<NamedNode, DatasetExt>
  let table : GraphPointer<NamedNode, DatasetExt>
  let columnMappingObservation : GraphPointer<NamedNode, DatasetExt>
  let observationTable : GraphPointer<NamedNode, DatasetExt>
  let dimensionMetadataCollection : GraphPointer<NamedNode, DatasetExt>

  let deleteTable: typeof import('../../../lib/domain/table/delete.js').deleteTable

  beforeEach(async () => {
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

    const getTableForColumnMapping = sinon.stub().resolves(observationTable.term.value)
    dimensionIsUsedByOtherMapping = sinon.stub().resolves(false)
    getReferencingMappingsForTable = sinon.stub().returns([])
    ;({ deleteTable } = await esmock('../../../lib/domain/table/delete.js', {
      '../../../lib/domain/queries/column-mapping.js': {
        dimensionIsUsedByOtherMapping,
        getReferencingMappingsForTable,
      },
    }, {
      '../../../lib/domain/queries/table.js': {
        getLinkedTablesForSource,
        getTablesForMapping,
        getTableForColumnMapping,
        getTableReferences: sinon.stub(),
        getCubeTable: sinon.stub(),
      },
      '../../../lib/domain/queries/dimension-metadata.js': {
        getDimensionMetaDataCollection: sinon.stub().resolves(dimensionMetadataCollection.term),
      },
      '../../../lib/domain/organization/query.js': {
        findOrganization: sinon.stub().resolves({
          organizationId: organization.id,
          projectId: project.id,
        }),
      },
    }))
  })

  it('deletes the table', async () => {
    // given

    // when
    await deleteTable({ resource: table.term, store })
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
    await deleteTable({ resource: observationTable.term, store })
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
    await deleteTable({ resource: observationTable.term, store })
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
    await deleteTable({ resource: table.term, store })
    await store.save()

    // then
    const deletedColumnMapping = await store.getResource<ColumnMapping>(columnMappingReferencing.term, { allowMissing: true })
    expect(deletedColumnMapping).to.eq(undefined)
  })
})
