import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import * as CsvMapping from '@cube-creator/model/CsvMapping'
import * as CsvSource from '@cube-creator/model/CsvSource'
import * as CsvColumn from '@cube-creator/model/CsvColumn'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import * as Table from '@cube-creator/model/Table'
import { cc } from '@cube-creator/core/namespace'
import * as ns from '@tpluscode/rdf-ns-builders'
import { buildCsvw } from '../../lib/csvw-builder'
import '../../lib/domain'
import { TestResourceStore } from '../support/TestResourceStore'
import { findColumn } from './support'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'

describe('lib/csvw-builder', () => {
  let table: Table.Table
  let csvSource: CsvSource.CsvSource
  let csvMapping: CsvMapping.CsvMapping
  let resources: TestResourceStore

  beforeEach(() => {
    const graph = clownface({ dataset: $rdf.dataset() })
    const csvSourcePointer = graph.namedNode('csv-mapping')
    const csvMappingPointer = graph.namedNode('table-source')

    csvMapping = CsvMapping.create(csvSourcePointer, {
      namespace: $rdf.namedNode('http://example.com/test-cube/'),
      project: $rdf.namedNode('project') as any,
    })

    csvSource = CsvSource.create(csvMappingPointer, {
      name: 'test-observation.csv',
      csvMapping,
      dialect: {
        delimiter: '-',
        quoteChar: '""',
      },
    })

    table = Table.create(graph.namedNode('table'), {
      name: 'test observation table',
      identifierTemplate: '{id}-{sub_id}',
      csvMapping,
      csvSource,
    })

    resources = new TestResourceStore([
      csvSourcePointer,
      csvMappingPointer,
    ])
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
    const columnMapping = ColumnMapping.literalFromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: $rdf.literal('year'),
    })
    resources.push(columnMapping.pointer)
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
    const columnMapping = ColumnMapping.literalFromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: $rdf.literal('year'),
    })
    resources.push(columnMapping.pointer)
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
    const columnMapping = ColumnMapping.literalFromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
    })
    resources.push(columnMapping.pointer)
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
    const columnMapping = ColumnMapping.literalFromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
      datatype: xsd.gYear,
    })
    resources.push(columnMapping.pointer)
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
    const columnMapping = ColumnMapping.literalFromPointer(clownface({ dataset: $rdf.dataset() }).namedNode('year-mapping'), {
      sourceColumn: $rdf.namedNode('jahr-column') as any,
      targetProperty: schema.yearBuilt,
      language: 'de-DE',
    })
    resources.push(columnMapping.pointer)
    table.columnMappings = [columnMapping] as any

    // when
    const csvw = await buildCsvw({ table, resources })

    // then
    const csvwColumn = findColumn(csvw, 'JAHR')
    expect(csvwColumn?.lang).to.eq('de-DE')
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
        hasValue: 'http://example.com/test-cube/',
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
