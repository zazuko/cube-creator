import namespace from '@rdfjs/namespace'
import env from './env'

type Shapes = 'shape/managed-dimension' | 'shape/managed-dimension-term-create' | 'shape/managed-dimension-term-update'

export const shape = namespace<Shapes>(`${env.MANAGED_DIMENSIONS_BASE}`)
