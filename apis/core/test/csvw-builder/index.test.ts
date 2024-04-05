import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import type { AnyContext, AnyPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import * as CsvMapping from '@cube-creator/model/CsvMapping'
import * as CsvSource from '@cube-creator/model/CsvSource'
import * as CsvColumn from '@cube-creator/model/CsvColumn'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import * as Table from '@cube-creator/model/Table'
import { cc } from '@cube-creator/core/namespace'
import * as ns from '@tpluscode/rdf-ns-builders'
import { schema, xsd, qudt } from '@tpluscode/rdf-ns-builders'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import sinon from 'sinon'
import { namedNode } from '@cube-creator/testing/clownface'
import { DefaultCsvwLiteral } from '@cube-creator/core/mapping'
import { buildCsvw } from '../../lib/csvw-builder/index.js'
import '../../lib/domain/index.js'
import * as orgQueries from '../../lib/domain/organization/query.js'
import { TestResourceStore } from '../support/TestResourceStore.js'
import { findColumn } from './support.js'

describe('lib/csvw-builder', () => {
  let graph: AnyPointer<AnyContext, DatasetExt>
  let table: Table.Table
  let csvSource: CsvSource.CsvSource
  let csvMapping: CsvMapping.CsvMapping
  let resources: TestResourceStore

  beforeEach(() => {
    sinon.restore()

    graph = $rdf.clownface()
    const csvSourcePointer = graph.namedNode('csv-mapping')
    const csvMappingPointer = graph.namedNode('table-source')
    const organization = $rdf.rdfine.cc.Organization(namedNode('org'), {
      namespace: $rdf.namedNode('http://example.com/'),
    })
    const project = $rdf.rdfine.cc.Project(namedNode('project'), {
      maintainer: organization,
      cubeIdentifier: 'test-cube',
    })

    csvMapping = CsvMapping.create($rdf, csvMappingPointer, {
      project: $rdf.namedNode('project'),
    })

    csvSource = CsvSource.create($rdf, csvSourcePointer, {
      name: 'test-observation.csv',
      csvMapping,
      dialect: {
        delimiter: '-',
        quoteChar: '""',
      },
      columns: [{
        name: 'id',
        order: 1,
      }, {
        name: 'name',
        order: 3,
      }, {
        name: 'sub_id',
        order: 2,
      }],
    })

    table = Table.create($rdf, graph.namedNode('table'), {
      name: 'test observation table',
      identifierTemplate: '{id}-{sub_id}',
      csvMapping,
      csvSource,
    })

    resources = new TestResourceStore([
      csvSourcePointer,
      csvMappingPointer,
      project,
      organization,
    ])

    sinon.stub(orgQueries, 'findOrganization').resolves({
      projectId: project.id,
      organizationId: organization.id,
    })
  })

  it("create a csvw resource with table's csvw URI", async () => {
    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.id).to.deep.eq(table.csvw.id)
  })

  it("sets csvw:url from table's source id", async () => {
    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.url).to.eq(csvSource.id.value)
  })

  it('combines namespace and identifier template to construct csvw:aboutUrl of observation table', async () => {
    // given
    table.types.add(cc.ObservationTable)

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.tableSchema?.aboutUrl).to.eq('http://example.com/test-cube/observation/{id}-{sub_id}')
  })

  it('generates observation URI when table identifier is empty', async () => {
    // given
    table.types.add(cc.ObservationTable)
    table.identifierTemplate = ''

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.tableSchema?.aboutUrl).to.eq('http://example.com/test-cube/observation/{id}-{sub_id}-{name}')
  })

  it('does not add "/observation" segment to csvw:aboutUrl when it is not observation table', async () => {
    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.tableSchema?.aboutUrl).to.eq('http://example.com/test-cube/{id}-{sub_id}')
  })

  it('copies csvw:dialect from CsvSource', async () => {
    // given
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.dialect?.quoteChar).to.eq('""')
    expect(csvw.dialect?.delimiter).to.eq('-')
  })

  it('returns unmapped source column as suppressed', async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.blankNode(), { name: 'id' }),
    ]

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'id')
    expect(csvwColumn?.suppressOutput)
    expect(csvwColumn?.title).to.deep.eq($rdf.literal('id'))
  })

  it("combines namespace and source column's target property csvw:propertyUrl", async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: $rdf.literal('year'),
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.propertyUrl).to.eq('http://example.com/test-cube/year')
  })

  it('does not add a duplicate csvw:column as suppressed', async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: $rdf.literal('year'),
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    expect(csvw.tableSchema?.column).to.have.length(1)
    expect(csvw.tableSchema?.column[0].suppressOutput).to.be.undefined
  })

  it("takes source column's target property as-is when it is a NamedNode", async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.propertyUrl).to.eq(schema.yearBuilt.value)
  })

  it('maps column with datatype', async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
      datatype: xsd.gYear,
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.datatype?.id).to.deep.eq(xsd.gYear)
  })

  it('maps column with language', async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
      language: 'de-DE',
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.lang).to.eq('de-DE')
  })

  it('maps column with default value', async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
      defaultValue: '2020',
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.default).to.eq('2020')
  })

  it('sets substitution default value for observation table literal columns without explicit default', async () => {
    // given
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('jahr-column'), { name: 'JAHR' }),
    ]
    const columnMapping = ColumnMapping.literalFromPointer($rdf.clownface().namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any
    table.types.add(cc.ObservationTable)

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.default).to.eq(DefaultCsvwLiteral)
  })

  it('maps column from reference column mapping', async () => {
    // given
    const stationSource = CsvSource.create($rdf, graph.namedNode('station-source'), {
      name: 'test-station.csv',
      csvMapping,
      dialect: { delimiter: '-', quoteChar: '""' },
    })
    stationSource.columns = [
      CsvColumn.fromPointer(stationSource.pointer.namedNode('column-station-id'), { name: 'ID' }),
      CsvColumn.fromPointer(stationSource.pointer.namedNode('column-station-name'), { name: 'NAME' }),
    ]
    resources.push(stationSource.pointer as any)
    const stationTable = Table.create($rdf, graph.namedNode('table-station'), {
      name: 'test station table',
      identifierTemplate: 'Station/{ID}/{NAME}',
      csvMapping,
      csvSource: stationSource,
    })
    resources.push(stationTable.pointer as any)
    csvSource.columns = [
      CsvColumn.fromPointer(csvSource.pointer.namedNode('ref-station'), { name: 'STATION' }),
      CsvColumn.fromPointer(csvSource.pointer.namedNode('ref-station-name'), { name: 'STATION-NAME' }),
    ]
    const columnMapping = ColumnMapping.referenceFromPointer($rdf.clownface().namedNode('station-mapping'), {
      targetProperty: $rdf.namedNode('station'),
      referencedTable: stationTable,
      identifierMapping: [
        { sourceColumn: $rdf.namedNode('ref-station'), referencedColumn: $rdf.namedNode('column-station-id') },
        { sourceColumn: $rdf.namedNode('ref-station-name'), referencedColumn: $rdf.namedNode('column-station-name') },
      ],
    })
    resources.push(columnMapping.pointer as any)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, $rdf.namedNode('station'))
    expect(csvwColumn?.valueUrl).to.eq('http://example.com/test-cube/Station/{STATION}/{STATION-NAME}')
    expect(csvwColumn?.pointer.out(qudt.pattern).value).to.eq('^http://example.com/test-cube/Station/.+/.+$')
  })

  it('adds a cc:cube virtual column to output of observation table', async () => {
    // given
    table.types.add(cc.ObservationTable)

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, cc.cube)
    expect(csvwColumn).to.matchShape({
      property: [{
        path: ns.csvw.virtual,
        hasValue: true,
        minCount: 1,
      }, {
        path: ns.csvw.propertyUrl,
        hasValue: cc.cube.value,
        nodeKind: ns.sh.Literal,
        minCount: 1,
      }, {
        path: ns.csvw.valueUrl,
        hasValue: 'http://example.com/test-cube',
        nodeKind: ns.sh.Literal,
        minCount: 1,
      }],
    })
  })

  it('does not add a cc:cube virtual column to output of ordinary table', async () => {
    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, cc.cube)
    expect(csvwColumn).to.be.undefined
  })
})
