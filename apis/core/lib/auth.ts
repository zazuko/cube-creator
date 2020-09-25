import { Router, Request, Response, NextFunction } from 'express'
import error from 'http-errors'
import env from './env'
import { log, warning } from './log'
import fetch from 'node-fetch'
import $rdf from 'rdf-ext'
import jwt from 'express-jwt'
import jwksRsa from 'jwks-rsa'

declare module '@hydrofoil/labyrinth' {
  export interface User {
    sub: string
    scope: string[]
  }
}

const createJwtHandler = (jwksUri: string) => jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri,
  }),

  // Validate the audience and the issuer.
  audience: env.AUTH_AUDIENCE,
  issuer: env.AUTH_ISSUER,
  algorithms: ['RS256'],
  credentialsRequired: false,
})

function devAuthHandler(req: Request, res: Response, next: NextFunction) {
  const sub = req.header('X-User')

  if (req.user) {
    return next()
  }

  if (sub) {
    const permissionHeader = req.headers['x-scope']
    const scope = typeof permissionHeader === 'string' ? permissionHeader.split(',').map(s => s.trim()) : permissionHeader || []

    req.user = {
      id: $rdf.namedNode(sub),
      sub,
      scope,
    }

    return next()
  }

  next(new error.Unauthorized())
}

export default async () => {
  const router = Router()

  if (env.has('AUTH_ISSUER')) {
    log('Setting up OIDC')
    const response = await fetch(`${env.AUTH_ISSUER}/.well-known/openid-configuration`)
    if (response.ok) {
      const oidcConfig = await response.json()
      router.use(createJwtHandler(oidcConfig.jwks_uri))
    } else {
      warning('Failed to load OpenID Connect settings from issuer')
    }
  }

  if (!env.production) {
    log('Enabling dev authentication backdoor')
    router.use(devAuthHandler)
  }

  return router
}
