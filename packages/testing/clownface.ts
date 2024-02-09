import type { BlankNode, NamedNode } from '@rdfjs/types'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'

export function namedNode(term: string | NamedNode): GraphPointer<NamedNode, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).namedNode(term)
}

export function blankNode(): GraphPointer<BlankNode, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).blankNode()
}
