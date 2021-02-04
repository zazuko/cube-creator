import { BlankNode, Quad, Term } from 'rdf-js'
import { csvw, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { customAlphabet } from 'nanoid'
import dict from 'nanoid-dictionary'
import $rdf from 'rdf-ext'

const nanoid = customAlphabet(dict.alphanumeric, 15)

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

export function keepCsvwDescribes(quad: Quad): boolean {
  return removeCsvwTriples(quad, true) && removeDefaultProperties(quad)
}

export function excludeAllCsvw(quad: Quad): boolean {
  return removeCsvwTriples(quad, false) && removeDefaultProperties(quad)
}

export function fromPublished(quad: Quad): boolean {
  return removeCsvwTriples(quad, false)
}

function rewriteBlankNode<T extends Term>(term: T, uuid: string): T | BlankNode {
  if (term.termType !== 'BlankNode') {
    return term
  }

  return $rdf.blankNode(`${uuid}${term.value}`)
}

export function ensureUniqueBnodes(this: Context, quad: Quad): Quad {
  const uuid = this.variables.get('bnodeUuid') ||
    this.variables.set('bnodeUuid', nanoid()).get('bnodeUuid')

  return $rdf.quad(
    rewriteBlankNode(quad.subject, uuid),
    quad.predicate,
    rewriteBlankNode(quad.object, uuid),
    quad.graph,
  )
}
