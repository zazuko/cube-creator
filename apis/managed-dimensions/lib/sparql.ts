import env from './env'

export const sparql = {
  endpointUrl: env.MANAGED_DIMENSIONS_STORE_ENDPOINT,
  updateUrl: env.MANAGED_DIMENSIONS_STORE_UPDATE_ENDPOINT,
  storeUrl: env.MANAGED_DIMENSIONS_STORE_GRAPH_ENDPOINT,
  user: env.maybe.MANAGED_DIMENSIONS_STORE_USERNAME,
  password: env.maybe.MANAGED_DIMENSIONS_STORE_PASSWORD,
}
