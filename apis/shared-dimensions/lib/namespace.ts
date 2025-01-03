import namespace from '@rdfjs/namespace'
import env from './env'

type Shapes = 'shape/shared-dimension-create'
| 'shape/shared-dimension-update'
| 'shape/shared-dimension-search'
| 'shape/shared-dimension-term-create'
| 'shape/shared-dimension-term-update'
| 'shape/hierarchy-create'
| 'shape/hierarchy'

export const shape = namespace<Shapes>(`${env.MANAGED_DIMENSIONS_BASE}dimension/_`)
