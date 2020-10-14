import { cc } from '@cube-creator/core/namespace'
import type { SingleEditor } from '@hydrofoil/shaperone-core'
import { editor } from '@/forms/bulma'

export const projectKindSelector: SingleEditor = {
  term: editor.RadioButtons,
  match (shape) {
    const { in: choices, path } = shape
    if (choices.length === 0) {
      return 0
    }
    if (choices.length > 5) {
      return null
    }
    const prop = Array.isArray(path) ? path[0] : path

    return prop?.equals(cc.projectSourceKind) ? 50 : null
  }
}
