import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import * as sinon from 'sinon'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import * as Organization from '@cube-creator/model/Organization'
import * as Project from '@cube-creator/model/Project'
import { createColumnMapping } from '../../../lib/domain/column-mapping/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import * as DimensionMetadataQueries from '../../../lib/domain/queries/dimension-metadata'
import * as orgQueries from '../../../lib/domain/organization/query'
import '../../../lib/domain'
import { DomainError } from '@cube-creator/api-errors'
import { NamedNode } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { namedNode } from '@cube-creator/testing/clownface'

describe('domain/column-mapping/create', () => {
  let store: TestResourceStore
  let table: GraphPointer<NamedNode, DatasetExt>
  let observationTable: GraphPointer<NamedNode, DatasetExt>
  let dimensionMetadata: GraphPointer<NamedNode, DatasetExt>

  beforeEach(() => {
    sinon.restore()

    const csvMapping = clownface({ dataset: $rdf.dataset() })
      .namedNode('csv-mapping')
      .addOut(rdf.type, cc.CsvMapping)
    const csvSource = clownface({ dataset: $rdf.dataset() })
      .namedNode('foo')
      .addOut(rdf.type, cc.CSVSource)
      .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
        column.addOut(schema.name, $rdf.literal('My Column'))
      })
    table = clownface({ dataset: $rdf.dataset() })
      .namedNode('myTable')
      .addOut(rdf.type, cc.Table)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)
    observationTable = clownface({ dataset: $rdf.dataset() })
      .namedNode('myObservationTable')
      .addOut(rdf.type, cc.Table)
      .addOut(rdf.type, cc.ObservationTable)
      .addOut(cc.csvMapping, csvMapping)
      .addOut(cc.csvSource, csvSource)

    dimensionMetadata = clownface({ dataset: $rdf.dataset() })
      .namedNode('myDimensionMetadata')
      .addOut(rdf.type, cc.DimensionMetadataCollection)

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
      organization,
      project,
    ])

    sinon.restore()
    sinon.stub(DimensionMetadataQueries, 'getDimensionMetaDataCollection').resolves(dimensionMetadata.term)

    sinon.stub(orgQueries, 'findOrganization').resolves({
      projectId: project.id,
      organizationId: organization.id,
    })
  })

  it('creates identifier by slugifying the column schema:name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, 'test')

    // when
    const columnMapping = await createColumnMapping({ resource, store, tableId: table.term })

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
    const columnMapping = await createColumnMapping({ resource, store, tableId: table.term })

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
    const columnMapping = await createColumnMapping({ resource, store, tableId: table.term })

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
    await createColumnMapping({ resource, store, tableId: table.term })

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
    await createColumnMapping({ resource, store, tableId: observationTable.term })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: {
        path: schema.hasPart,
        minCount: 1,
        hasValue: $rdf.namedNode('myDimensionMetadata/test'),
      },
    })

    const testLiteral = dimensionMetadata.node($rdf.namedNode('myDimensionMetadata/test'))
    expect(testLiteral).to.matchShape({
      property: {
        path: schema.about,
        minCount: 1,
        maxCount: 1,
        hasValue: $rdf.namedNode('test'),
      },
    })
  })

  it('reuses existing Dimension Metadata for column', async () => {
    // given
    dimensionMetadata.addOut(schema.hasPart, $rdf.namedNode('dimensions/existingDimension'), dimension => {
      dimension.addOut(schema.about, $rdf.namedNode('existingDimension'))
        .addOut(schema.name, $rdf.literal('Year', 'en'))
    })

    store.push(dimensionMetadata)

    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('existingDimension'))

    // when
    await createColumnMapping({ resource, store, tableId: observationTable.term })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: {
        path: schema.hasPart,
        minCount: 1,
        maxCount: 1,
      },
    })
  })

  it('creates Dimension Metadata for column, literal property', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.literal('testLiteral'))

    // when
    await createColumnMapping({ resource, store, tableId: observationTable.term })

    // then
    expect(dimensionMetadata).to.matchShape({
      property: {
        path: schema.hasPart,
        minCount: 1,
        hasValue: $rdf.namedNode('myDimensionMetadata/testLiteral'),
      },
    })

    const testLiteral = dimensionMetadata.node($rdf.namedNode('myDimensionMetadata/testLiteral'))
    expect(testLiteral).to.matchShape({
      property: {
        path: schema.about,
        minCount: 1,
        maxCount: 1,
        hasValue: $rdf.namedNode('http://example.com/test-cube/testLiteral'),
      },
    })
  })

  it('do not throw if same column mapping with same targetProperty is added twice', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
    await createColumnMapping({ resource, store, tableId: table.term })

    // when
    const createdAgain = await createColumnMapping({ resource, store, tableId: table.term })

    // then
    expect(createdAgain).to.be.ok
  })

  it('throw if same column mapping with same targetProperty is added twice to an observation table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
      .addOut(cc.targetProperty, $rdf.namedNode('test'))
    await createColumnMapping({ resource, store, tableId: observationTable.term })

    // then
    expect(createColumnMapping({ resource, store, tableId: observationTable.term })).to.rejectedWith(Error)
  })

  describe('when some column mappings exist on observation table', () => {
    it('throws when exact targetProperty is used for new property', async () => {
      // given
      const existingMapping = clownface({ dataset: $rdf.dataset() })
        .namedNode('mapping')
        .addOut(rdf.type, cc.ColumnMapping)
        .addOut(cc.targetProperty, $rdf.literal('year'))
      store.push(existingMapping)
      observationTable.addOut(cc.columnMapping, existingMapping)
      const resource = clownface({ dataset: $rdf.dataset() })
        .node($rdf.namedNode(''))
        .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
        .addOut(cc.targetProperty, $rdf.literal('year'))

      // when
      const promise = createColumnMapping({ resource, store, tableId: observationTable.term })

      // then
      await expect(promise).to.have.rejectedWith(DomainError)
    })

    it('throws when exact targetProperty URI is used for new property', async () => {
      // given
      const existingMapping = clownface({ dataset: $rdf.dataset() })
        .namedNode('mapping')
        .addOut(rdf.type, cc.ColumnMapping)
        .addOut(cc.targetProperty, $rdf.namedNode('year'))
      store.push(existingMapping)
      observationTable.addOut(cc.columnMapping, existingMapping)
      const resource = clownface({ dataset: $rdf.dataset() })
        .node($rdf.namedNode(''))
        .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
        .addOut(cc.targetProperty, $rdf.namedNode('year'))

      // when
      const promise = createColumnMapping({ resource, store, tableId: observationTable.term })

      // then
      await expect(promise).to.have.rejectedWith(DomainError)
    })

    it('throws when target property would result in an URI used explicitly', async () => {
      // given
      const existingMapping = clownface({ dataset: $rdf.dataset() })
        .namedNode('mapping')
        .addOut(rdf.type, cc.ColumnMapping)
        .addOut(cc.targetProperty, $rdf.namedNode('http://example.com/test-cube/year'))
      store.push(existingMapping)
      observationTable.addOut(cc.columnMapping, existingMapping)
      const resource = clownface({ dataset: $rdf.dataset() })
        .node($rdf.namedNode(''))
        .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
        .addOut(cc.targetProperty, $rdf.literal('year'))

      // when
      const promise = createColumnMapping({ resource, store, tableId: observationTable.term })

      // then
      await expect(promise).to.have.rejectedWith(DomainError)
    })
  })
})
