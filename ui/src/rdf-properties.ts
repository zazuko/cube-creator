import $rdf from '@rdf-esm/dataset'
import { DataFactory, Quad } from 'rdf-js'
import { expand as _expand } from '@zazuko/rdf-vocabularies/expand'
import { shrink as _shrink } from '@zazuko/rdf-vocabularies/shrink'
import * as _vocabFactories from '@zazuko/rdf-vocabularies/datasets'
import { rdf } from '@tpluscode/rdf-ns-builders'

const relevantPrefixes = ['rdfs', 'schema', 'qb', 'sdmx', 'dcterms', 'dc11', 'skos', 'skosxl', 'xkos', 'xsd', 'wgs']
const vocabFactories = _vocabFactories as Record<string, (factory: DataFactory) => Quad[]>

export async function loadCommonProperties (): Promise<string[]> {
  const quads = Object.keys(vocabFactories)
    .filter((prefix) => relevantPrefixes.includes(prefix))
    .flatMap((prefix: string) => vocabFactories[prefix]($rdf))

  const dataset = $rdf.dataset(quads)

  return [...dataset.match(null, rdf.type, rdf.Property)]
    .map((property: Quad) => shrink(property.subject.value))
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
