import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { SparqlTemplateResult } from '@tpluscode/rdf-string'
import env from './env'

export function lindasQuery(query: SparqlTemplateResult): NamedNode {
  return $rdf.namedNode(`${env.PUBLIC_QUERY_ENDPOINT}?query=${encodeURIComponent(query.toString())}`)
}
