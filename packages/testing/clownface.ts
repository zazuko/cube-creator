import type { BlankNode, NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'

export function namedNode(term: string | NamedNode): GraphPointer<NamedNode, DatasetExt> {
  return $rdf.clownface().namedNode(term)
}

export function blankNode(): GraphPointer<BlankNode, DatasetExt> {
  return $rdf.clownface().blankNode()
}
