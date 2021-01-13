import { Quad } from 'rdf-js'
import { csvw, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

const csvwNs = csvw().value
const csvwDescribes = csvw.describes

function removeCsvwTriples(quad: Quad, keepCsvwDescribes: boolean): boolean {
  if (quad.predicate.value.startsWith(csvwNs)) {
    if (quad.predicate.equals(csvwDescribes)) {
      return keepCsvwDescribes
    }

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

function removeDefaultProperties(quad: Quad): boolean {
  return !quad.predicate.value.startsWith('#')
}

export function fromTransformed(quad: Quad): boolean {
  return removeCsvwTriples(quad, true) && removeDefaultProperties(quad)
}

export function fromPublished(quad: Quad): boolean {
  return removeCsvwTriples(quad, false)
}
