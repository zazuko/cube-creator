import * as expressMiddlewareShacl from 'hydra-box-middleware-shacl'
import { NamedNode } from 'rdf-js'
import ResourceStoreImpl from '../ResourceStore'
import { streamClient } from '../query-client'
import { loadResourcesTypes } from '../domain/queries/resources-types'

type CreateMiddleware = Pick<Parameters<typeof expressMiddlewareShacl.shaclMiddleware>[0], 'parseResource'>

const createMiddleware = ({ parseResource }: CreateMiddleware = {}) => expressMiddlewareShacl.shaclMiddleware({
  loadResource(id: NamedNode) {
    return new ResourceStoreImpl(streamClient).get(id, { allowMissing: true })
  },
  loadResourcesTypes,
  parseResource,
})

type Middleware = typeof createMiddleware & {
  override: typeof createMiddleware
}

export const shaclValidate: Middleware = createMiddleware() as any
shaclValidate.override = createMiddleware
