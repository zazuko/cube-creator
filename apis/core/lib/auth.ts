import { Router, Request, Response, NextFunction, RequestHandler } from 'express'
import error from 'http-errors'
import env from '@cube-creator/core/env'
import fetch from 'node-fetch'
import jwt from 'express-jwt'
import jwksRsa from 'jwks-rsa'
import { DELETE } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import { log, warning } from './log'
import * as idOf from './domain/identifiers'

declare module '@hydrofoil/labyrinth' {
  export interface User {
    sub: string
    name: string
    permissions: string[]
  }
}

const createJwtHandler = (credentialsRequired: boolean, jwksUri: string) => jwt({
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
  credentialsRequired,
})

function devAuthHandler(req: Request, res: Response, next: NextFunction) {
  const sub = req.header('X-User')

  if (req.user) {
    return next()
  }

  if (sub) {
    const permissionHeader = req.headers['x-permission']
    const permissions = typeof permissionHeader === 'string' ? permissionHeader.split(',').map(s => s.trim()) : permissionHeader || []

    req.user = {
      sub,
      name: sub,
      permissions,
    }

    return next()
  }

  next(new error.Unauthorized())
}

function setUserId(req: Request, res: Response, next: NextFunction) {
  if (req.user && req.user.sub) {
    req.user.id = idOf.user(req.user.sub)
  }

  return next()
}

export default async () => {
  const router = Router()

  if (env.has('AUTH_ISSUER')) {
    log('Setting up OIDC')
    const response = await fetch(`${env.AUTH_ISSUER}/.well-known/openid-configuration`)
    if (response.ok) {
      const oidcConfig = await response.json()
      router.use(createJwtHandler(env.production, oidcConfig.jwks_uri))
    } else {
      warning('Failed to load OpenID Connect settings from issuer')
    }
  }

  if (!env.production) {
    log('Enabling dev authentication backdoor')
    router.use(devAuthHandler)
  }

  router.use(setUserId).use(updateUserResource())

  return router
}

function updateUserResource(): RequestHandler {
  const users = new TermSet()

  return (req, res, next) => {
    if (req.user?.id && !users.has(req.user.id)) {
      const { id, name, sub } = req.user
      users.add(id)

      req.once('end', () => {
        DELETE`
          GRAPH ${id} {
            ${id} ${schema.name} ?name .
          }
        `.INSERT`
          GRAPH ${id} {
            ${id} ${schema.name} "${name || sub}"; a ${schema.Person} .
          }
        `.WHERE`
            OPTIONAL {
              GRAPH ${id} {
                ${id} ${schema.name} ?name .
              }
            }
        `.execute(req.labyrinth.sparql.query)
          .catch(warning)
      })
    }
    next()
  }
}
