import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { createTable } from '../../../lib/domain/table/create'
import { TestResourceStore } from '../../support/TestResourceStore'

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
})
