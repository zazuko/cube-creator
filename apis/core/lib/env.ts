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

type KnownVariables = {
  [P in ENV_VARS]: string
}

export default new Proxy(process.env, handler) as typeof process['env'] & KnownVariables & {
  has(name: ENV_VARS): boolean
  production: boolean
  maybe: Partial<KnownVariables>
}
