import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { createTable } from '../../../lib/domain/table/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import { NamedNode } from 'rdf-js'

describe('domain/table/create', () => {
  let store: TestResourceStore
  const tableCollection = clownface({ dataset: $rdf.dataset(), term: $rdf.namedNode('tables') }).addOut(cc.csvMapping, $rdf.namedNode('myCsvMapping'))
  const csvSource = clownface({ dataset: $rdf.dataset() }).namedNode('foo')

  beforeEach(() => {
    store = new TestResourceStore([
      tableCollection,
      csvSource,
    ])
  })

  it('creates identifier by slugifying schema:name', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#aaa')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))

    // when
    const table = await createTable({ resource, store, tableCollection })

    // then
    expect(table.out(schema.name).value).to.eq('the name')
    expect(table.term.value).to.match(/myCsvMapping\/table\/the-name-(.+)$/)
    expect(table.out(schema.color).term!.value).to.eq('#aaa')
  })

  it('creates correctly shaped cc:Table', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))

    // when
    const table = await createTable({ resource, store, tableCollection })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        [sh.hasValue.value]: [cc.Table, hydra.Resource],
        minCount: 2,
      }, {
        path: cc.csvw,
        pattern: 'myCsvMapping/table/the-name-(.+)/csvw$',
        minCount: 1,
        maxCount: 1,
      }, {
        path: cc.csvMapping,
        hasValue: $rdf.namedNode('myCsvMapping'),
        minCount: 1,
      }, {
        path: cc.identifierTemplate,
        hasValue: '{id}',
        minCount: 1,
      }],
    })
  })

  it('creates cc:ObservationTable if flagged', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(cc.isObservationTable, true)
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))

    // when
    const table = await createTable({ resource, store, tableCollection })

    // then
    expect(table).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.ObservationTable,
        minCount: 1,
      }],
    })
  })

  it('creates a ColumnMapping resources for selected source columns', async () => {
    // given
    const resource = clownface({ dataset: $rdf.dataset() })
      .node($rdf.namedNode(''))
      .addOut(schema.name, 'the name')
      .addOut(schema.color, '#ababab')
      .addOut(cc.identifierTemplate, '{id}')
      .addOut(cc.csvSource, $rdf.namedNode('foo'))
      .addOut(csvw.column, [$rdf.namedNode('source-column-1'), $rdf.namedNode('source-column-2')])
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-1'), column => column.addOut(schema.name, 'column 1'))
    csvSource.addOut(csvw.column, $rdf.namedNode('source-column-2'), column => column.addOut(schema.name, 'column 2'))

    // when
    const table = await createTable({ resource, store, tableCollection })
    const column = await store.get(table.out(cc.columnMapping).terms[0] as NamedNode)

    // then
    expect(table.out(cc.columnMapping).terms).to.have.length(2)
    expect(column).to.matchShape({
      property: [{
        path: rdf.type,
        hasValue: cc.ColumnMapping,
        minCount: 1,
      }, {
        path: cc.sourceColumn,
        minCount: 1,
        maxCount: 1,
      }, {
        path: cc.targetProperty,
        minCount: 1,
        maxCount: 1,
      }],
    })
  })
})
