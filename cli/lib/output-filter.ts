import { Quad } from 'rdf-js'
import { csvw, rdf } from '@tpluscode/rdf-ns-builders'

const csvwNs = csvw().value

export function removeCsvwTriples(quad: Quad) {
  if (quad.predicate.value.startsWith(csvwNs)) {
    return false
  }
  if (rdf.type.equals(quad.predicate) && quad.object.value.startsWith(csvwNs)) {
    return false
  }
  return true
}
