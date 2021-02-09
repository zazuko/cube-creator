import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { hydra, schema } from '@tpluscode/rdf-ns-builders'
import { md } from '@cube-creator/core/namespace'
import { NamedNode, Term } from 'rdf-js'

export function getManagedDimensions(term: NamedNode) {
  return CONSTRUCT`
    ${term} ${hydra.member} ?termSet ; a ${md.ManagedDimensions}, ${hydra.Collection}.
    ?termSet ?p ?o .
  `
    .WHERE`
      GRAPH ?g {
        ?termSet a ${schema.DefinedTermSet}, ${md.ManagedDimension} .
        ?termSet ?p ?o .
      }
    `
}

export function getManagedTerms(managedDimension: Term, collection: NamedNode) {
  return CONSTRUCT`
      ${collection} ${hydra.member} ?term ; a ${md.ManagedDimensionTerms} .
      ?term ?p ?o .
    `
    .WHERE`
      GRAPH ?g {
        ${managedDimension} a ${md.ManagedDimension} .
        ?term ${schema.inDefinedTermSet} ${managedDimension} ; ?p ?o .
      }
    `
}
