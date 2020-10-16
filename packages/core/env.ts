const handler = {
  get(env: typeof process.env, prop: string) {
    if (prop === 'has') {
      return (name: string) => {
        return !!env[name]
      }
    }

    if (prop === 'maybe') {
      return env
    }

    if (prop === 'production') {
      return env.NODE_ENV !== 'development'
    }

    const value = env[prop]

    if (!value) {
      throw new Error(`Missing environment variable ${prop}`)
    }

    return value
  },
}

type ENV_VARS =
  'AUTH_ISSUER'
  | 'AUTH_AUDIENCE'
  | 'AUTH_CONFIG_FILE'
  | 'STORE_QUERY_ENDPOINT'
  | 'STORE_UPDATE_ENDPOINT'
  | 'STORE_GRAPH_ENDPOINT'
  | 'STORE_ENDPOINTS_USERNAME'
  | 'STORE_ENDPOINTS_PASSWORD'
  | 'API_CORE_BASE'
  | 'VUE_APP_API_CORE_BASE'
  | 'AWS_S3_ENDPOINT'
  | 'AWS_S3_BUCKET'
  | 'AWS_ACCESS_KEY_ID'
  | 'AWS_SECRET_ACCESS_KEY'

type KnownVariables = {
  [P in ENV_VARS]: string
}

const env = new Proxy(process.env, handler) as typeof process['env'] & KnownVariables & {
  has(name: ENV_VARS): boolean
  production: boolean
  maybe: Partial<KnownVariables>
}

export const baseUri = env.maybe.API_CORE_BASE || env.VUE_APP_API_CORE_BASE
export default env
