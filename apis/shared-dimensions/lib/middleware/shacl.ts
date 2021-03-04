import { shaclMiddleware } from 'hydra-box-middleware-shacl'
import shapes from '../shapes'

export const shaclValidate = shaclMiddleware({
  async loadResource(id) {
    return shapes.get(id)?.() || null
  },
  async loadResourcesTypes() {
    return []
  },
})
