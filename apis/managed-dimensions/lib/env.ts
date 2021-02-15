import { createProxy } from '@cube-creator/core/env'
import $rdf from 'rdf-ext'

const prefix = 'MANAGED_DIMENSIONS_'

type ENV_VARS = 'GRAPH'
| 'SOURCE'
| 'BASE'
| 'STORE_ENDPOINT'
| 'STORE_UPDATE_ENDPOINT'
| 'STORE_GRAPH_ENDPOINT'
| 'STORE_USERNAME'
| 'STORE_PASSWORD'

type PREFIXED_ENV_VARS<U> = U extends ENV_VARS ? `${typeof prefix}${U}` : never

const env = createProxy<PREFIXED_ENV_VARS<ENV_VARS>>()

export default env
export const graph = $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH)
