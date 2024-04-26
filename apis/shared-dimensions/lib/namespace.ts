import $rdf from '@zazuko/env'
import env from './env.js'

type Shapes = 'shape/shared-dimension-create'
| 'shape/shared-dimension-update'
| 'shape/shared-dimension-term-create'
| 'shape/shared-dimension-term-update'
| 'shape/hierarchy-create'
| 'shape/hierarchy'

export const shape = $rdf.namespace<Shapes>(`${env.MANAGED_DIMENSIONS_BASE}dimension/_`)
