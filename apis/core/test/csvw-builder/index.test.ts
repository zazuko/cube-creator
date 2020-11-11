import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import * as CsvMapping from '@cube-creator/model/CsvMapping'
import * as CsvSource from '@cube-creator/model/CsvSource'
import * as Table from '@cube-creator/model/Table'
import { buildCsvw } from '../../lib/csvw-builder'
import '../../lib/domain'
import { TestResourceStore } from '../support/TestResourceStore'

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
})
