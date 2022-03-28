import { decorate, PropertyTemplate } from '@hydrofoil/shaperone-wc/templates'
import { html } from '@hydrofoil/shaperone-wc'
import { sh1 } from '@cube-creator/core/namespace'

export default decorate((wrapped: PropertyTemplate): PropertyTemplate => {
  return (renderer, { property }) => {
    const allObjectsEmptyAndReadonly = property.shape.readOnly && property.objects.every(obj => !obj.object)

    if (allObjectsEmptyAndReadonly && property.shape.getBoolean(sh1.hideWithoutObjects)) {
      return html``
    }

    return wrapped(renderer, { property })
  }
})
