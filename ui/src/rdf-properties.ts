import $rdf from '@rdf-esm/dataset'
import { Quad } from 'rdf-js'
import { expand as _expand } from './lib/expand'
import { shrink as _shrink } from '@zazuko/rdf-vocabularies/shrink'
import { rdfs, schema, qb, sdmx, dcterms, dc11, skos, skosxl, xkos, xsd, wgs } from '@zazuko/rdf-vocabularies/datasets'
import prefixes from '@zazuko/rdf-vocabularies/prefixes'
import { rdf } from '@tpluscode/rdf-ns-builders'

const vocabs = { rdfs, schema, qb, sdmx, dcterms, dc11, skos, skosxl, xkos, xsd, wgs }

export function loadCommonProperties (): string[] {
  return Object.entries(vocabs).flatMap(([prefix, factory]) => {
    const dataset = $rdf.dataset(factory($rdf))
    const baseIRI = prefixes[prefix]
    const graph = $rdf.namedNode(baseIRI)
    const properties = [...dataset.match(null, rdf.type, rdf.property, graph)]

    return properties.map((property: Quad) => shrink(property.subject.value))
  })
}

export function expand (uri: string): string {
  if (uri && !uri.includes(':')) return uri

  if (uri.startsWith('http://')) return uri

  try {
    return _expand(uri)
  } catch {
    return uri
  }
}

export function expandWithBase (uri: string, baseUri: string): string {
  if (uri && !uri.includes(':')) return `${baseUri}${uri}`

  return expand(uri)
}

export function shrink (uri: string): string {
  return _shrink(uri) || uri
}
