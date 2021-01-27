import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { SparqlTemplateResult } from '@tpluscode/rdf-string'

export function lindasQuery(query: SparqlTemplateResult): NamedNode {
  // TODO: Switch to production system once stable.
  return $rdf.namedNode('https://test.lindas.admin.ch/query?query=' + encodeURIComponent(query.toString()))
}
