import type { NamedNode } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { SparqlTemplateResult } from '@tpluscode/rdf-string'
import env from '@cube-creator/core/env/node'

export function lindasQuery(query: SparqlTemplateResult): NamedNode {
  return $rdf.namedNode(`${env.PUBLIC_QUERY_ENDPOINT}?query=${encodeURIComponent(query.toString())}`)
}

export function lindasQueryTemplate(query: SparqlTemplateResult, ...variables: string[]) {
  const url = lindasQuery(query)
  return variables.reduce(replacePlaceholders, url.value)
}

function replacePlaceholders(prev: string, variable: string) {
  return prev.replace(new RegExp(`_${variable}_`, 'g'), `{${variable}}`)
}
