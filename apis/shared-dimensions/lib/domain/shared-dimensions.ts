import { CONSTRUCT, SELECT, sparql } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import namespace from '@rdfjs/namespace'
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

function textSearch(subject: Term, predicate: Term, textQuery: string) {
  switch (env.maybe.MANAGED_DIMENSIONS_STORE_ENGINE) {
    case 'stardog': {
      const fts = namespace('tag:stardog:api:search:')
      const variable = $rdf.variable('_s')
      return sparql`
        service ${fts.textMatch} {
          [] ${fts.query} '${textQuery + '*'}';
             ${fts.result} ${variable} ;
        }
        ${subject} ${predicate} ${variable} .
      `
    }
    case 'fuseki': {
      const variable = $rdf.variable('_s')
      return sparql`
        ${subject} <http://jena.apache.org/text#query> (${predicate} '${textQuery + '*'}') .

        # Second filtering to make sure the word starts with the given query
        ${subject} ${predicate} ${variable} .
        FILTER (REGEX(${variable}, "^${textQuery}", "i"))
      `
    }
    default: {
      const variable = $rdf.variable('_s')
      return sparql`
        ${subject} ${predicate} ${variable} .
        FILTER (REGEX(${variable}, "^${textQuery}", "i"))
      `
    }
  }
}
