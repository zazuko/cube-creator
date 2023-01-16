import { insertTestDimensions } from '@cube-creator/testing/lib/seedData'
import namespace from '@rdfjs/namespace'
import { schema, rdfs, qb, xsd } from '@tpluscode/rdf-ns-builders/strict'
import { expect } from 'chai'
import { ASK } from '@tpluscode/sparql-builder'
import { mdClients } from '@cube-creator/testing/lib/index'
import { deleteDynamicTerms } from '../../../../lib/domain/shared-dimension/queries'

const { parsingClient } = mdClients

const ns = namespace('https://ld.admin.ch/cube/dimension/')

describe('@cube-creator/shared-dimensions-api/lib/shared-dimension/queries @SPARQL', () => {
  describe('deleteDynamicTerms', () => {
    beforeEach(insertTestDimensions)

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

    it('does nothing when there are no deleted dimensions', async () => {
      // when
      await deleteDynamicTerms({
        dimension: ns.technologies,
        properties: [],
        graph: 'https://lindas.admin.ch/cube/dimension',
      })

      // then
      await expect(
        ASK`${ns['technologies/sparql']}
          ${schema.validFrom} "2021-01-20T23:59:59Z"^^${xsd.dateTime} ;
          ${schema.identifier} "sparql" ;
          ${schema.name} "SPARQL"@en ;
          ${schema.inDefinedTermSet} ${ns.technologies} ;
          ${schema.color} ?c ;
          ${qb.order} 10 ;
          ${rdfs.comment} "This term has dynamic properties"@en ;
        .`.execute(parsingClient.query),
      ).to.eventually.be.true
    })
  })
})
