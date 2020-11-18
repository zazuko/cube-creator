import prefixes from '@zazuko/rdf-vocabularies/prefixes'

// todo remove after https://github.com/zazuko/rdf-vocabularies/issues/76
export function expand (prefixed: string): string {
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
