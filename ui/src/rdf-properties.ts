import $rdf from '@rdf-esm/dataset'
import { Quad } from 'rdf-js'
import { shrink as _shrink } from '@zazuko/rdf-vocabularies/shrink'
import prefixes from '@zazuko/rdf-vocabularies/prefixes'
import { rdf } from '@tpluscode/rdf-ns-builders'

export async function loadCommonProperties (): Promise<string[]> {
  const vocabs = await import('./vocabularies')

  return Object.entries(vocabs).flatMap(([prefix, factory]) => {
    const dataset = $rdf.dataset(factory($rdf))
    const baseIRI = prefixes[prefix]
    const graph = $rdf.namedNode(baseIRI)
    const properties = [...dataset.match(null, rdf.type, rdf.Property, graph)]

    return properties.map((property: Quad) => _shrink(property.subject.value))
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

export function shrink (uri: string): string {
  return _shrink(uri) || uri
}

// Copied from @zazuko/rdf-vocabularies
// TODO: remove after https://github.com/zazuko/rdf-vocabularies/issues/76
function _expand (prefixed: string): string {
  const [prefix, term] = prefixed.split(':')
  if (!prefix || !term) {
    return ''
  }

  const baseIRI = prefixes[prefix]
  if (!baseIRI) {
    throw new Error(`Unavailable prefix '${prefix}:'`)
  }

  return `${baseIRI}${term}`
}
