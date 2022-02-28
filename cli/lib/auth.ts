/* eslint-disable camelcase */
import querystring from 'querystring'
import fetch from 'node-fetch'
import { Logger } from 'winston'
import { HydraClient } from 'alcaeus/alcaeus'
import once from 'once'

export type AuthConfig = {
  issuer: string
  clientId: string
  clientSecret: string
  params?: Map<string, string>
}

type Metadata = {
  token_endpoint: string
}

type Token = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

type TokenError = {
  error: string
  error_description?: string
}

type TokenResponse = Token | TokenError

type LiveToken = Token & {
  expiration: number
}

function isValid(token: LiveToken) {
  return token.expiration > Date.now() + 60 * 1000
}

const getMetadata = once(async (config: AuthConfig) => {
  const response = await fetch(
    `${config.issuer}/.well-known/openid-configuration`,
  )
  return (await response.json()) as Metadata
})

const getToken = async function (config: AuthConfig) {
  const metadata = await getMetadata(config)

  const params: Record<string, string> = {
    grant_type: 'client_credentials',
    client_id: config.clientId,
    client_secret: config.clientSecret,
  }

  config.params?.forEach((value, key) => (params[key] = value))

  const response = await fetch(metadata.token_endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify(params),
  })

  const newToken = (await response.json()) as TokenResponse

  if ('error' in newToken) {
    throw new Error(newToken.error_description || newToken.error)
  }

  const expiration = Date.now() + newToken.expires_in * 1000
  return {
    ...newToken,
    expiration,
  }
}

function defaultAuthConfig(log: Logger): AuthConfig {
  const clientId = process.env.AUTH_RUNNER_CLIENT_ID
  const clientSecret = process.env.AUTH_RUNNER_CLIENT_SECRET
  const issuer = process.env.AUTH_RUNNER_ISSUER

  if (clientId && clientSecret && issuer) {
    return {
      clientId,
      clientSecret,
      issuer,
    }
  }

  log.info('OIDC config ' + JSON.stringify({ clientId, clientSecret, issuer }, null, 2))
  throw new Error('Incomplete OIDC config')
}

export function setupAuthentication(config: Partial<AuthConfig>, log: Logger, Hydra: HydraClient) {
  let token: LiveToken | undefined

  Hydra.defaultHeaders = async () => {
    if (!token || !isValid(token)) {
      token = await getToken({ ...defaultAuthConfig(log), ...config })
    }

    return {
      Authorization: `Bearer ${token.access_token}`,
    }
  }
}
