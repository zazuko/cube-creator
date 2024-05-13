import $rdf from '@cube-creator/env'
import type { Quad } from '@rdfjs/types'
import { shrink as _shrink } from '@zazuko/prefixes/shrink'
import { expand as _expand } from '@zazuko/prefixes/expand'
import prefixes from '@zazuko/prefixes'
import { rdf } from '@tpluscode/rdf-ns-builders'

export async function loadCommonProperties (): Promise<string[]> {
  const vocabs = await import('./vocabularies.js')

  return Object.entries(vocabs).flatMap(([prefix, factory]) => {
    const dataset = $rdf.dataset(factory({ factory: $rdf }))
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

export function shrink (uri: string, customBase?: string): string {
  if (customBase && uri.startsWith(customBase)) {
    return uri.replace(customBase, '').replace(/^[/#]/, '')
  } else {
    return _shrink(uri) || uri
  }
}
