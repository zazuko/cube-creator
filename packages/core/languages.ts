import $rdf from '@zazuko/env'

export const supportedLanguages = ['de', 'fr', 'it', 'rm', 'en'].map(v => $rdf.literal(v))
