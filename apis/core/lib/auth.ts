import { Router, Request, Response, NextFunction } from 'express'
import env from './env'
import jwt = require('express-jwt');
import jwksRsa = require('jwks-rsa')

declare module 'express-serve-static-core' {
  export interface Request {
    user: {
      sub: string
      permissions: string[]
    }
  }
}

const createJwtHandler = (credentialsRequired: boolean) => jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${env.AUTH_ISSUER}/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  audience: env.AUTH_AUDIENCE,
  issuer: env.AUTH_ISSUER,
  algorithms: ['RS256'],
  credentialsRequired,
})

function devAuthHandler(req: Request, res: Response, next: NextFunction) {
  const sub = req.header('X-User')

  if (!req.user && sub) {
    const permissionHeader = req.headers['x-permission']
    const permissions = typeof permissionHeader === 'string' ? permissionHeader.split(',').map(s => s.trim()) : permissionHeader || []

    req.user = {
      sub,
      permissions,
    }
  }

  next()
}

export default () => {
  const router = Router()

  if (env.has('AUTH_ISSUER')) {
    router.use(createJwtHandler(true))
  }

  if (!env.production) {
    router.use(devAuthHandler)
  }

  return router
}
