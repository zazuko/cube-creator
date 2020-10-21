/* eslint-disable camelcase */
import fetch from 'node-fetch'
import { Debugger } from 'debug'
import querystring from 'querystring'
import { Hydra } from 'alcaeus/node'
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

const getToken = async function (config: AuthConfig, log: Debugger) {
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

  log('Renewed access token', newToken)

  const expiration = Date.now() + newToken.expires_in * 1000
  return {
    ...newToken,
    expiration,
  }
}

function defaultAuthConfig(): AuthConfig {
  return {
    clientId: process.env.AUTH_CLIENT_ID!,
    clientSecret: process.env.AUTH_CLIENT_SECRET!,
    issuer: process.env.AUTH_ISSUER!,
  }
}

export function setupAuthentication(config: Partial<AuthConfig>, log: Debugger) {
  let token: LiveToken | undefined

  Hydra.defaultHeaders = async () => {
    if (!token || !isValid(token)) {
      token = await getToken({ ...defaultAuthConfig(), ...config }, log)
    }

    return {
      Authorization: `Bearer ${token.access_token}`,
    }
  }
}
