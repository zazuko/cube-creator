import type { NamedNode } from '@rdfjs/types'
import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import sinon from 'sinon'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { csvw, hydra, prov, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { DomainError, NotFoundError } from '@cube-creator/api-errors'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import { namedNode } from '@cube-creator/testing/clownface'
import esmock from 'esmock'
import { TestResourceStore } from '../../support/TestResourceStore.js'
import '../../../lib/domain/index.js'

describe('domain/column-mapping/update', () => {
  let store: TestResourceStore
  const getLinkedTablesForSource = sinon.stub()
  const getTablesForMapping = sinon.stub()
  let getDimensionMetaDataCollection: sinon.SinonStub
  let findOrganization: sinon.SinonStub
  let getTableForColumnMapping: sinon.SinonStub
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>
  let dimensionMappings: GraphPointer<NamedNode, DatasetExt>
  let columnMapping: GraphPointer<NamedNode, DatasetExt>
  let columnMappingObservation: GraphPointer<NamedNode, DatasetExt>
  let observationTable: GraphPointer<NamedNode, DatasetExt>

  let updateLiteralColumnMapping: typeof import('../../../lib/domain/column-mapping/update.js').updateLiteralColumnMapping

  beforeEach(async () => {
    const csvMapping = $rdf.clownface()
      .namedNode('csv-mapping')
      .addOut(rdf.type, cc.CsvMapping)
      .addOut(cc.namespace, 'http://example.com/')
    const csvSource = $rdf.clownface()
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column'))
      })
      .addOut(csvw.column, $rdf.namedNode('my-column2'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column 2'))
      })

    columnMapping = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(rdf.type, [cc.ColumnMapping, cc.LiteralColumnMapping])
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const otherColumnMapping = $rdf.clownface()
      .node($rdf.namedNode('otherColumnMapping'))
      .addOut(rdf.type, [cc.ColumnMapping, cc.LiteralColumnMapping])
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column2'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const table = $rdf.clownface()
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(cc.columnMapping, columnMapping)
      .addOut(cc.columnMapping, otherColumnMapping)

    columnMappingObservation = $rdf.clownface()
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(rdf.type, [cc.ColumnMapping, cc.LiteralColumnMapping])
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)

    const otherColumnMappingObservation = $rdf.clownface()
      .node($rdf.namedNode('otherColumnMappingObservation'))
      .addOut(rdf.type, cc.ColumnMapping)
      .addOut(rdf.type, hydra.Resource)
      .addOut(cc.sourceColumn, $rdf.namedNode('my-other-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    observationTable = $rdf.clownface()
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
      .addOut(cc.columnMapping, columnMappingObservation)
      .addOut(cc.columnMapping, otherColumnMappingObservation)

    const dimensionProperty = $rdf.namedNode('test')

    dimensionMappings = $rdf.clownface()
      .namedNode('dimension-mappings')
      .addOut(rdf.type, prov.Dictionary)
      .addOut(schema.about, dimensionProperty)

    dimensionMetadata = $rdf.clownface()
      .namedNode('myDimensionMetadata')
      .addOut(rdf.type, cc.DimensionMetadataCollection)
      .addOut(schema.hasPart, $rdf.namedNode('myDimension'), dim => {
        dim
          .addOut(schema.about, dimensionProperty)
          .addOut(cc.dimensionMapping, dimensionMappings)
      })

    const organization = $rdf.rdfine.cc.Organization(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = $rdf.rdfine.cc.Project(namedNode('project'), {
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

    getTableForColumnMapping.resolves(table.term.value)

    findOrganization.resolves({
      projectId: project.id,
      organizationId: organization.id,
    })

    getDimensionMetaDataCollection.resolves(dimensionMetadata.term)
  })

  before(async function () {
    this.timeout(5000)

    findOrganization = sinon.stub()
    getTableForColumnMapping = sinon.stub()
    getDimensionMetaDataCollection = sinon.stub();
    ({ updateLiteralColumnMapping } = await esmock('../../../lib/domain/column-mapping/update.js', {
      '../../../lib/domain/queries/table.js': {
        getLinkedTablesForSource,
        getTablesForMapping,
        getTableForColumnMapping,
        getTableReferences: sinon.stub(),
        getCubeTable: sinon.stub(),
      },
    }, {
      '../../../lib/domain/organization/query.js': {
        findOrganization,
      },
      '../../../lib/domain/queries/dimension-metadata.js': {
        getDimensionMetaDataCollection,
      },
    }))
  })

  it('updates simple properties', async () => {
    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test2'))
      .addOut(cc.datatype, xsd.string)
      .addOut(cc.language, $rdf.literal('de'))
      .addOut(cc.defaultValue, $rdf.literal('test2'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store })

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
    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store })

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
    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column2'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store })

    expect(columnMapping.out(cc.sourceColumn).value).to.eq('my-column2')
  })

  it('throw if column does not exist', async () => {
    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column3'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const promise = updateLiteralColumnMapping({ resource, store })

    await expect(promise).to.have.rejectedWith(NotFoundError)
  })

  it('throw if targetProperty already in use on observation table', async () => {
    getTableForColumnMapping.resolves(observationTable.term.value)

    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const promise = updateLiteralColumnMapping({ resource, store })

    await expect(promise).to.have.rejectedWith(DomainError)
  })

  it('do not throw if targetProperty already in use on non-observation table', async () => {
    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMapping'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('other'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store })

    expect(columnMapping.out(cc.targetProperty).value).to.eq('other')
  })

  it('change targetProperty for obeservation table', async () => {
    getTableForColumnMapping.resolves(observationTable.term.value)

    const resource = $rdf.clownface()
      .node($rdf.namedNode('columnMappingObservation'))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test2'))
      .addOut(cc.datatype, xsd.integer)
      .addOut(cc.language, $rdf.literal('fr'))
      .addOut(cc.defaultValue, $rdf.literal('test'))

    const columnMapping = await updateLiteralColumnMapping({ resource, store })

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
