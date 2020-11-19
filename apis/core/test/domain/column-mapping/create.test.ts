import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { csvw, hydra, rdf, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { createColumnMapping } from '../../../lib/domain/column-mapping/create'
import { TestResourceStore } from '../../support/TestResourceStore'
import '../../../lib/domain'
import { DomainError } from '../../../lib/errors'

describe('domain/column-mapping/create', () => {
  let store: TestResourceStore
  const csvMapping = clownface({ dataset: $rdf.dataset() })
    .namedNode('csv-mapping')
    .addOut(rdf.type, cc.CsvMapping)
    .addOut(cc.namespace, 'http://example.com/')
  const table = clownface({ dataset: $rdf.dataset() })
    .namedNode('myTable')
    .addOut(rdf.type, cc.Table)
    .addOut(cc.csvMapping, csvMapping)
  const csvSource = clownface({ dataset: $rdf.dataset() })
    .namedNode('foo')
    .addOut(rdf.type, cc.CSVSource)
    .addOut(csvw.column, $rdf.namedNode('my-column'), (column) => {
      column.addOut(schema.name, $rdf.literal('My Column'))
    })
  table.addOut(cc.csvSource, csvSource.term)

  beforeEach(() => {
    store = new TestResourceStore([
      table,
      csvSource,
      csvMapping,
    ])
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

  describe('when some column mappings exist', () => {
    it('throws when exact targetProperty is used for new property', async () => {
      // given
      const existingMapping = clownface({ dataset: $rdf.dataset() })
        .namedNode('mapping')
        .addOut(rdf.type, cc.ColumnMapping)
        .addOut(cc.targetProperty, $rdf.literal('year'))
      store.push(existingMapping)
      table.addOut(cc.columnMapping, existingMapping)
      const resource = clownface({ dataset: $rdf.dataset() })
        .node($rdf.namedNode(''))
        .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
        .addOut(cc.targetProperty, $rdf.literal('year'))

      // when
      const promise = createColumnMapping({ resource, store, tableId: table.term })

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
      table.addOut(cc.columnMapping, existingMapping)
      const resource = clownface({ dataset: $rdf.dataset() })
        .node($rdf.namedNode(''))
        .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
        .addOut(cc.targetProperty, $rdf.namedNode('year'))

      // when
      const promise = createColumnMapping({ resource, store, tableId: table.term })

      // then
      await expect(promise).to.have.rejectedWith(DomainError)
    })

    it('throws when target property would result in an URI used explicitly', async () => {
      // given
      const existingMapping = clownface({ dataset: $rdf.dataset() })
        .namedNode('mapping')
        .addOut(rdf.type, cc.ColumnMapping)
        .addOut(cc.targetProperty, $rdf.namedNode('http://example.com/year'))
      store.push(existingMapping)
      table.addOut(cc.columnMapping, existingMapping)
      const resource = clownface({ dataset: $rdf.dataset() })
        .node($rdf.namedNode(''))
        .addOut(cc.sourceColumn, $rdf.namedNode('my-column'))
        .addOut(cc.targetProperty, $rdf.literal('year'))

      // when
      const promise = createColumnMapping({ resource, store, tableId: table.term })

      // then
      await expect(promise).to.have.rejectedWith(DomainError)
    })
  })
})
