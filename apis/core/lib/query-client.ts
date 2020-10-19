import StreamClient from 'sparql-http-client'
import env from '@cube-creator/core/env'

export const streamClient = new StreamClient({
  endpointUrl: env.STORE_QUERY_ENDPOINT,
  updateUrl: env.STORE_UPDATE_ENDPOINT,
  storeUrl: env.STORE_GRAPH_ENDPOINT,
  user: env.maybe.STORE_ENDPOINTS_USERNAME,
  password: env.maybe.STORE_ENDPOINTS_PASSWORD,
})
