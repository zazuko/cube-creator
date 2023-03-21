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

  set(obj: typeof process.env, prop: string, value: string | undefined) {
    obj[prop] = value
    return true
  },
}

type ENV_VARS =
  'AUTH_ISSUER'
  | 'AUTH_AUDIENCE'
  | 'AUTH_CONFIG_FILE'
  | 'AUTH_ACCESS_REQUEST'
  | 'STORE_QUERY_ENDPOINT'
  | 'STORE_UPDATE_ENDPOINT'
  | 'STORE_GRAPH_ENDPOINT'
  | 'STORE_ENDPOINTS_USERNAME'
  | 'STORE_ENDPOINTS_PASSWORD'
  | 'STORE_ENGINE'
  | 'API_CORE_BASE'
  | 'AWS_S3_ENDPOINT'
  | 'AWS_S3_BUCKET'
  | 'AWS_ACCESS_KEY_ID'
  | 'AWS_SECRET_ACCESS_KEY'
  | 'PIPELINE_TYPE'
  | 'PIPELINE_URI'
  | 'PIPELINE_TOKEN'
  | 'PIPELINE_ENV'
  | 'PUBLIC_QUERY_ENDPOINT'
  | 'TRIFID_UI'
  | 'VISUALIZE_UI'
  | 'UI_BASE'
  | 'GITLAB_TOKEN'
  | 'GITLAB_API_URL'

type KnownVariables<T extends string> = {
  /* eslint-disable-next-line no-unused-vars */
  [P in T]: string
}

export const createProxy = <T extends string>() => new Proxy(process.env, handler) as KnownVariables<T> & {
  has(name: ENV_VARS): boolean
  production: boolean
  maybe: Partial<KnownVariables<T>>
}

export default createProxy<ENV_VARS>()
