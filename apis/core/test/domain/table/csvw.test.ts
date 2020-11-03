import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { csvw, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { createCsvw } from '../../../lib/domain/table/csvw'
import { TestResourceStore } from '../../support/TestResourceStore'
import { ResourceStore } from '../../../lib/ResourceStore'
import { NamedNode } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'

describe('domain/table/csvw', () => {
  describe('createCsvw', () => {
    let table: GraphPointer<NamedNode, DatasetExt>
    let source: GraphPointer<NamedNode, DatasetExt>
    let mapping: GraphPointer<NamedNode, DatasetExt>
    let resources: ResourceStore

    beforeEach(() => {
      const tableId = $rdf.namedNode('cc:table')
      const sourceId = $rdf.namedNode('cc:source')
      const mappingId = $rdf.namedNode('cc:mapping')
      table = clownface({ dataset: $rdf.dataset() })
        .namedNode(tableId)
        .addOut(cc.csvSource, sourceId)
        .addOut(cc.csvw, $rdf.namedNode('cc:table/csvw'))
        .addOut(cc.csvMapping, mappingId)
      mapping = clownface({ dataset: $rdf.dataset() })
        .namedNode(mappingId)
        .addOut(rdf.type, cc.CsvMapping)
        .addOut(cc.namespace, $rdf.namedNode('http://example.com/cube/'))
      source = clownface({ dataset: $rdf.dataset() })
        .node(sourceId)
        .addOut(csvw.dialect)

      resources = new TestResourceStore([
        table,
        source,
        mapping,
      ])
    })

    it('copies csvw:dialect from CsvSource', async function () {
      // given
      source
        .addOut(schema.associatedMedia, media => {
          media.addOut(schema.contentUrl, $rdf.namedNode('content url'))
        })
        .out(csvw.dialect)
        .addOut(csvw.quoteChar, '""')
        .addOut(csvw.delimiter, '-')

      // when
      const generatedCsvw = await createCsvw({
        resources,
        tableResource: table.term,
      })

      // then
      expect(generatedCsvw.dialect?.quoteChar).to.eq('""')
      expect(generatedCsvw.dialect?.delimiter).to.eq('-')
    })

    it('copies sources url to csvw:url', async function () {
      // when
      const generatedCsvw = await createCsvw({
        resources,
        tableResource: table.term,
      })

      // then
      expect(generatedCsvw.url).to.equal(source.value)
    })

    it('constructs observation table aboutUrl by concatenating namespace and id template', async () => {
      // given
      table.addOut(cc.identifierTemplate, '{foo}/{bar}/{baz}')

      // when
      const generatedCsvw = await createCsvw({
        resources,
        tableResource: table.term,
      })

      // then
      expect(generatedCsvw.tableSchema?.aboutUrl).to.eq('http://example.com/cube/observation/{foo}/{bar}/{baz}')
    })
  })
})
