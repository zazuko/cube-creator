import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { SparqlTemplateResult } from '@tpluscode/rdf-string'

export function lindasQuery(query: SparqlTemplateResult): NamedNode {
  return $rdf.namedNode('https://register.ld.admin.ch/query?query=' + encodeURIComponent(query.toString()))
}
