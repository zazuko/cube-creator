import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { md } from '@cube-creator/core/namespace'

export function getHierarchies() {
  return CONSTRUCT`
    ?h ?p ?o .
  `
    .WHERE`
      ?h a ${md.Hierarchy} .
      ?h ?p ?o .
    `
}
