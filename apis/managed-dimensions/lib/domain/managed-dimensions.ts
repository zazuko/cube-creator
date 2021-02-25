import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { meta } from '@cube-creator/core/namespace'
import { Term } from 'rdf-js'

export function getManagedDimensions() {
  return CONSTRUCT`
    ?termSet ?p ?o .
  `
    .WHERE`
      ?termSet a ${schema.DefinedTermSet}, ${meta.SharedDimension} .
      ?termSet ?p ?o .
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
