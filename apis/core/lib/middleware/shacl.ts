import * as expressMiddlewareShacl from 'hydra-box-middleware-shacl'
import { NamedNode } from 'rdf-js'
import ResourceStoreImpl from '../ResourceStore'
import { streamClient } from '../query-client'
import { loadResourcesTypes } from '../domain/queries/resources-types'

export const shaclValidate = expressMiddlewareShacl.shaclMiddleware({
  loadResource(id: NamedNode) {
    return new ResourceStoreImpl(streamClient).get(id, { allowMissing: true })
  },
  loadResourcesTypes,
})
