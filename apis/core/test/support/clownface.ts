import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { BlankNode, NamedNode } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'

export function namedNode(term: string): GraphPointer<NamedNode, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).namedNode(term)
}

export function blankNode(): GraphPointer<BlankNode, DatasetExt> {
  return clownface({ dataset: $rdf.dataset() }).blankNode()
}
