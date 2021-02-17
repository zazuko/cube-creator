import namespace from '@rdfjs/namespace'
import env from './env'

type Shapes = 'shape/managed-dimension'

export const shape = namespace<Shapes>(`${env.MANAGED_DIMENSIONS_BASE}`)
