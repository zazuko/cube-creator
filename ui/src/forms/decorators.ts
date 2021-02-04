import {
  ComponentDecorator,
  RenderFunc,
  SingleEditorActions,
  SingleEditorRenderParams
} from '@hydrofoil/shaperone-core/models/components'
import { Lazy, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sh1 } from '@cube-creator/core/namespace'

function decorate (render: RenderFunc<SingleEditorRenderParams, SingleEditorActions, any>): RenderFunc<SingleEditorRenderParams, SingleEditorActions, any> {
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

export const fieldIf: ComponentDecorator<SingleEditorComponent | Lazy<SingleEditorComponent>> = {
  applicableTo (): boolean {
    return true
  },
  decorate (component) {
    if ('lazyRender' in component) {
      return {
        ...component,
        async lazyRender () {
          const render = await component.lazyRender()
          return decorate(render)
        }
      }
    }

    return {
      ...component,
      render: decorate(component.render),
    }
  },
}
