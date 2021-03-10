declare module 'rdf-validate-datatype' {
  import type { Quad, Term } from 'rdf-js'

  export function validateTerm(term: Term): boolean
  export function validateQuad(quad: Quad): boolean
}
