import { describe, it } from 'mocha'
import { expect } from 'chai'
import $rdf from 'rdf-ext'
import clownface from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { createCsvw } from '../../../lib/domain/table/csvw'
import { TestResourceStore } from '../../support/TestResourceStore'

describe('domain/table/csvw', () => {
  describe('createCsvw', () => {
    it('copies csvw:dialect from CsvSource', async function () {
      // given
      const tableResource = $rdf.namedNode('cc:table')
      const sourceId = $rdf.namedNode('cc:source')
      const resources = new TestResourceStore([
        clownface({ dataset: $rdf.dataset() })
          .node(tableResource)
          .addOut(cc.csvSource, sourceId)
          .addOut(cc.csvw, $rdf.namedNode('cc:table/csvw')),
        clownface({ dataset: $rdf.dataset() })
          .node(sourceId)
          .addOut(schema.associatedMedia, media => {
            media.addOut(schema.contentUrl, $rdf.namedNode('content url'))
          })
          .addOut(csvw.dialect, dialect => {
            dialect.addOut(csvw.quoteChar, '""')
            dialect.addOut(csvw.separator, '-')
          }),
      ])

      // when
      const table = await createCsvw({
        resources,
        tableResource,
      })

      // then
      expect(table.dialect?.toJSON()).to.matchSnapshot(this)
    })

    it('copies sources contentUrl to csvw:url', async function () {
      // given
      const tableResource = $rdf.namedNode('cc:table')
      const sourceId = $rdf.namedNode('cc:source')
      const resources = new TestResourceStore([
        clownface({ dataset: $rdf.dataset() })
          .node(tableResource)
          .addOut(cc.csvSource, sourceId)
          .addOut(cc.csvw, $rdf.namedNode('cc:table/csvw')),
        clownface({ dataset: $rdf.dataset() })
          .node(sourceId)
          .addOut(schema.associatedMedia, media => {
            media.addOut(schema.contentUrl, $rdf.namedNode('content url'))
          })
          .addOut(csvw.dialect),
      ])

      // when
      const table = await createCsvw({
        resources,
        tableResource,
      })

      // then
      expect(table.url).to.equal('content url')
    })
  })
})
