import { shaclMiddleware } from 'hydra-box-middleware-shacl'
import $rdf from 'rdf-ext'
import shapes from '../shapes'
import env from '../env'

export const shaclValidate = shaclMiddleware({
  async loadResource(id) {
    return shapes.get(id)?.() || null
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
})
