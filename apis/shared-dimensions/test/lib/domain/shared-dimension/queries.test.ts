import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import namespace from '@rdfjs/namespace'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { expect } from 'chai'
import { ASK } from '@tpluscode/sparql-builder'
import { mdClients } from '@cube-creator/testing/lib/index'
import { deleteDynamicTerms } from '../../../../lib/domain/shared-dimension/queries'

const { parsingClient } = mdClients

const ns = namespace('https://ld.admin.ch/cube/dimension/')

describe('@cube-creator/shared-dimensions-api/lib/shared-dimension/queries @SPARQL', () => {
  describe('deleteDynamicTerms', () => {
    before(insertTestDimensions)

    it('deletes dynamic property from terms', async () => {
      // when
      await deleteDynamicTerms({
        dimension: ns.technologies,
        properties: [schema.color],
        graph: 'https://lindas.admin.ch/cube/dimension',
      })

      // then
      await expect(
        ASK`${ns['technologies/sparql']} ${schema.color} ?c`.execute(parsingClient.query),
      ).to.eventually.be.false
    })
  })
})
