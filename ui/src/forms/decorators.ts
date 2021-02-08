import { ComponentDecorator } from '@hydrofoil/shaperone-core/models/components'
import { Lazy, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sh1 } from '@cube-creator/core/namespace'

export const fieldIf: ComponentDecorator<SingleEditorComponent | Lazy<SingleEditorComponent>> = {
  applicableTo (): boolean {
    return true
  },
  decorate (component) {
    return {
      ...component,
      _decorateRender (render) {
        return function ({ focusNode, property, value, ...params }, { remove, ...actions }) {
          const onlyIf = property.shape.pointer.out(sh1.if)

          if (onlyIf) {
            const path = onlyIf.out(sh.path).term
            const hasValue = onlyIf.out(sh.hasValue).term

            if (hasValue && !focusNode.out(path).term?.equals(hasValue)) {
              remove()
            }
          }

          return render({ focusNode, property, value, ...params }, { remove, ...actions })
        }
      }
    }
  },
}
