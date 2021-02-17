import { literal } from '@rdf-esm/data-model'

export const supportedLanguages = ['de', 'fr', 'it', 'rm', 'en'].map(v => literal(v))
