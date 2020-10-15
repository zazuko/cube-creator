import ParsingClient from 'sparql-http-client/ParsingClient'
import env from '../../env'

export const client = new ParsingClient({
  endpointUrl: env.STORE_QUERY_ENDPOINT,
  updateUrl: env.STORE_UPDATE_ENDPOINT,
  storeUrl: env.STORE_GRAPH_ENDPOINT,
  user: env.maybe.STORE_ENDPOINTS_USERNAME,
  password: env.maybe.STORE_ENDPOINTS_PASSWORD,
})
