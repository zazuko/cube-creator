import { shaclMiddleware } from 'hydra-box-middleware-shacl'
import $rdf from '@zazuko/env'
import shapes from '../shapes/index.js'
import env from '../env.js'

type CreateMiddleware = Pick<Parameters<typeof shaclMiddleware>[0], 'parseResource'>

const createMiddleware = ({ parseResource }: CreateMiddleware = {}) => shaclMiddleware({
  async loadResource(id, req) {
    const mappedId = $rdf.namedNode(id.value.replace(env.MANAGED_DIMENSIONS_API_BASE, env.MANAGED_DIMENSIONS_BASE))

    return shapes.get(mappedId)?.(req) || null
  },
  async loadResourcesTypes() {
    return []
  },
  getTargetNode(req) {
    if (req.method === 'PUT') {
      // needs to override the target node to validate because
      // the SHACL middleware runs before camouflage-rewrite
      return $rdf.namedNode(req.absoluteUrl().replace(env.MANAGED_DIMENSIONS_BASE, env.MANAGED_DIMENSIONS_API_BASE))
    }

    // however, I don't understand why only when updating existing resources
    return undefined
  },
  parseResource,
})

type Middleware = typeof createMiddleware & {
  override: typeof createMiddleware
}

export const shaclValidate: Middleware = createMiddleware() as any
shaclValidate.override = createMiddleware
