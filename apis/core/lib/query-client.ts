import StreamClient from 'sparql-http-client'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import env from '@cube-creator/core/env'

const clientConfig = {
  endpointUrl: env.STORE_QUERY_ENDPOINT,
  updateUrl: env.STORE_UPDATE_ENDPOINT,
  storeUrl: env.STORE_GRAPH_ENDPOINT,
  user: env.maybe.STORE_ENDPOINTS_USERNAME,
  password: env.maybe.STORE_ENDPOINTS_PASSWORD,
}

export const streamClient = new StreamClient(clientConfig)

export const parsingClient = new ParsingClient(clientConfig)

export const publicClient = new ParsingClient({
  endpointUrl: env.PUBLIC_QUERY_ENDPOINT,
})
