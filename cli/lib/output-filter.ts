import { Quad } from 'rdf-js'
import { csvw, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

const csvwNs = csvw().value

export function removeCsvwTriples(quad: Quad): boolean {
  if (quad.predicate.value.startsWith(csvwNs)) {
    return false
  }
  if (rdf.type.equals(quad.predicate) && quad.object.value.startsWith(csvwNs)) {
    return false
  }
  return true
}

export function removeCubeLinks(quad: Quad): boolean {
  return !quad.predicate.equals(cc.cube)
}
