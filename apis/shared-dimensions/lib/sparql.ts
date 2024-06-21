import ParsingClient from 'sparql-http-client/ParsingClient.js'
import StreamClient from 'sparql-http-client/StreamClient.js'
import env from './env.js'

export const sparql = {
  endpointUrl: env.MANAGED_DIMENSIONS_STORE_QUERY_ENDPOINT,
  updateUrl: env.MANAGED_DIMENSIONS_STORE_UPDATE_ENDPOINT,
  storeUrl: env.MANAGED_DIMENSIONS_STORE_GRAPH_ENDPOINT,
  user: env.maybe.MANAGED_DIMENSIONS_STORE_USERNAME,
  password: env.maybe.MANAGED_DIMENSIONS_STORE_PASSWORD,
}

export const parsingClient = new ParsingClient(sparql)
export const streamClient = new StreamClient(sparql)
