import { Term } from 'rdf-js'
import { CONSTRUCT, DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { toRdf } from 'rdf-literal'
import env from '../env'
import { textSearch } from '../query'

export function getSharedDimensions() {
  return CONSTRUCT`
    ?termSet ?p ?o .
    ?termSet ${md.terms} ?terms .
    ?termSet ${md.export} ?export .
  `
    .WHERE`
      ?termSet a ${schema.DefinedTermSet}, ${meta.SharedDimension} .
      ?termSet ?p ?o .

      MINUS { ?termSet ${md.export} ?o }

      BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?terms )

      OPTIONAL {
        ?termSet a ${md.SharedDimension} .
        BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_export?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?export )
      }
    `
}

interface GetSharedTerms {
  sharedDimensions: Term[]
  freetextQuery: string | undefined
  limit?: number
  offset?: number
  validThrough?: Date
}

export function getSharedTerms({ sharedDimensions, freetextQuery, validThrough, limit = 10, offset = 0 }: GetSharedTerms) {
  const term = $rdf.variable('term')
  const name = $rdf.variable('name')
  const sharedDimension = $rdf.variable('sharedDimension')

  let select = SELECT.DISTINCT`${term}`
    .WHERE`
      ${sharedDimension} a ${meta.SharedDimension} .
      VALUES ${sharedDimension} { ${sharedDimensions} }
      ${term} ${schema.inDefinedTermSet} ${sharedDimension} .
      ${term} ${schema.name} ${name} .
    `

  if (freetextQuery) {
    select = select.WHERE`${textSearch(term, schema.name, freetextQuery)}`
  }

  if (validThrough) {
    select = select.WHERE`OPTIONAL {
      ${term} ${schema.validThrough} ?validThrough .
    }

    FILTER (
      !bound(?validThrough) || ?validThrough >= ${toRdf(validThrough)}
    )`
  }

  return DESCRIBE`
      ${term} ${sharedDimension}
    `
    .WHERE`
      {
        ${select.LIMIT(limit).OFFSET(offset).ORDER().BY(sharedDimension).THEN.BY(name)}
      }

      ${term} ?p ?o .
      ${term} ${schema.inDefinedTermSet} ${sharedDimension} .
    `
}
