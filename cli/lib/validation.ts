import { Quad } from 'rdf-js'
import $rdf from 'rdf-ext'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { validateQuad } from 'rdf-validate-datatype'

export function validate(this: Context, quad: Quad): Quad {
  if (!validateQuad(quad)) {
    // Take advantage of rdf-ext's `toString`
    const quadExt = $rdf.quad(quad.subject, quad.predicate, quad.object)
    throw new Error(`Quad object has invalid datatype:\n\t${quadExt.toString()}`)
  }

  return quad
}
