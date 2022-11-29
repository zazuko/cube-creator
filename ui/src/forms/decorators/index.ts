import { ComponentDecorator } from '@hydrofoil/shaperone-core/models/components'
import { Lazy, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import { dash, sh } from '@tpluscode/rdf-ns-builders'
import { sh1 } from '@cube-creator/core/namespace'
import { InstancesSelectEditor } from '@hydrofoil/shaperone-core/components'

export { dimensionMetaHierarchySynchronizer } from './dimensionMetaHierarchySynchronizer'

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

export const clearInstance: ComponentDecorator<InstancesSelectEditor> = {
  applicableTo (component): boolean {
    return component.editor.equals(dash.InstancesSelectEditor)
  },
  decorate (component) {
    return {
      ...component,
      _decorateRender (render) {
        return function ({ value, ...params }, { clear, update, ...actions }) {
          const rendered = render({ value, ...params }, { clear, update, ...actions })
          const { object } = value
          const { defaultValue } = params.property.shape

          if (object) {
            if (object.term.equals(defaultValue)) {
              return rendered
            }

            const hasValue = value.componentState.instances?.some((inst) => inst.term.equals(object.term))
            if (!hasValue && defaultValue && !object.term.equals(defaultValue)) {
              update(defaultValue)
            } else if (!hasValue) {
              clear()
            }
          }

          return rendered
        }
      },
    }
  },
}
