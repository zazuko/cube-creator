import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { meta } from '@cube-creator/core/namespace'

export function getHierarchies() {
  return CONSTRUCT`
    ?h ?p ?o .
  `
    .WHERE`
      ?h a ${meta.Hierarchy} .
      ?h ?p ?o .
    `
}
