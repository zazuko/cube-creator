import { createProxy } from '@cube-creator/core/env'
import $rdf from 'rdf-ext'

const prefix = 'MANAGED_DIMENSIONS_'

type ENV_VARS = 'GRAPH'
| 'API_BASE'
| 'STORE_QUERY_ENDPOINT'
| 'STORE_UPDATE_ENDPOINT'
| 'STORE_GRAPH_ENDPOINT'
| 'STORE_USERNAME'
| 'STORE_PASSWORD'
| 'TERM_BASE'

type PREFIXED_ENV_VARS<U> = U extends ENV_VARS ? `${typeof prefix}${U}` : never

const env = createProxy<PREFIXED_ENV_VARS<ENV_VARS>>()

export default env
export const graph = $rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH)
