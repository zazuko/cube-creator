import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { Term } from 'rdf-js'
import env from '../env'

export function getSharedDimensions() {
  return CONSTRUCT`
    ?termSet ?p ?o .
    ?termSet ${md.terms} ?terms .
  `
    .WHERE`
      ?termSet a ${schema.DefinedTermSet}, ${meta.SharedDimension} .
      ?termSet ?p ?o .

      BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_API_BASE}", "terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?terms )
    `
}

export function getSharedTerms(sharedDimension: Term) {
  return CONSTRUCT`
      ?term ?p ?o .
    `
    .WHERE`
      ${sharedDimension} a ${meta.SharedDimension} .
      ?term ${schema.inDefinedTermSet} ${sharedDimension} ; ?p ?o .
    `
}
