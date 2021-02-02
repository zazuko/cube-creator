import namespace from '@rdfjs/namespace'
import env from './env'

type MD_VOCAB = 'ManagedDimensions'
| 'ManagedDimensionTerms'
| 'managedDimensions'

export const dimension = namespace('https://ld.admin.ch/dimension/')
export const lindasSchema = namespace('https://schema.ld.admin.ch/')
export const md = namespace<MD_VOCAB>(`${env.MANAGED_DIMENSIONS_BASE}api#`)
