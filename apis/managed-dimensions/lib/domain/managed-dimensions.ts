import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { Term } from 'rdf-js'
import env from '../env'

export function getManagedDimensions() {
  return CONSTRUCT`
    ?termSet ?p ?o .
    ?termSet ${md.terms} ?terms .
  `
    .WHERE`
      ?termSet a ${schema.DefinedTermSet}, ${meta.SharedDimension} .
      ?termSet ?p ?o .

      BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?terms )
    `
}

export function getManagedTerms(managedDimension: Term) {
  return CONSTRUCT`
      ?term ?p ?o .
    `
    .WHERE`
      ${managedDimension} a ${meta.SharedDimension} .
      ?term ${schema.inDefinedTermSet} ${managedDimension} ; ?p ?o .
    `
}
