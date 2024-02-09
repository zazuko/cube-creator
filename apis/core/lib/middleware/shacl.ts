import type { NamedNode } from '@rdfjs/types'
import * as expressMiddlewareShacl from 'hydra-box-middleware-shacl'
import ResourceStoreImpl from '../ResourceStore'
import { streamClient } from '../query-client'
import { loadResourcesTypes } from '../domain/queries/resources-types'

type CreateMiddleware = Pick<Parameters<typeof expressMiddlewareShacl.shaclMiddleware>[0], 'parseResource' | 'loadShapes' | 'disableShClass'>

const createMiddleware = ({ parseResource, loadShapes, disableShClass }: CreateMiddleware = {}) => expressMiddlewareShacl.shaclMiddleware({
  loadResource(id: NamedNode) {
    return new ResourceStoreImpl(streamClient).get(id, { allowMissing: true })
  },
  loadResourcesTypes,
  parseResource,
  loadShapes,
  disableShClass,
})

type Middleware = typeof createMiddleware & {
  override: typeof createMiddleware
}

export const shaclValidate: Middleware = createMiddleware() as any
shaclValidate.override = createMiddleware
