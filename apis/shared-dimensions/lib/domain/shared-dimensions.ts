import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { Term } from 'rdf-js'
import $rdf from 'rdf-ext'
import { toRdf } from 'rdf-literal'
import env from '../env'

export function getSharedDimensions() {
  return CONSTRUCT`
    ?termSet ?p ?o .
    ?termSet ${md.terms} ?terms .
    ?termSet ${md.export} ?export .
  `
    .WHERE`
      ?termSet a ${schema.DefinedTermSet}, ${meta.SharedDimension} .
      ?termSet ?p ?o .

      BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?terms )

      OPTIONAL {
        ?termSet a ${md.SharedDimension} .
        BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_export?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?export )
      }
    `
}

interface GetSharedTerms {
  sharedDimension: Term
  freetextQuery: string | undefined
  limit?: number
  offset?: number
  validThrough?: Date
}

export function getSharedTerms({ sharedDimension, freetextQuery, validThrough, limit = 10, offset = 0 }: GetSharedTerms) {
  const term = $rdf.variable('term')
  const name = $rdf.variable('name')

  let select = SELECT.DISTINCT`${term}`
    .WHERE`
      ${sharedDimension} a ${meta.SharedDimension} .
      ${term} ${schema.inDefinedTermSet} ${sharedDimension} .
      ${term} ${schema.name} ${name} .
    `

  if (freetextQuery) {
    select = select.WHERE`FILTER (
      REGEX(${name}, "^${freetextQuery}", "i")
    )`
  }

  if (validThrough) {
    select = select.WHERE`OPTIONAL {
      ${term} ${schema.validThrough} ?validThrough .
    }

    FILTER (
      !bound(?validThrough) || ?validThrough >= ${toRdf(validThrough)}
    )`
  }

  return CONSTRUCT`
      ${term} ?p ?o .
    `
    .WHERE`
      {
        ${select.LIMIT(limit).OFFSET(offset).ORDER().BY(name)}
      }

      ${term} ?p ?o .
    `
}
