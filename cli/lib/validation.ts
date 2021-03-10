import { Quad } from 'rdf-js'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { validateQuad } from 'rdf-validate-datatype'

export function validate(this: Context, quad: Quad): Quad {
  if (!validateQuad(quad)) {
    throw new Error(`Quad has invalid datatype: ${quad}`)
  }

  return quad
}
