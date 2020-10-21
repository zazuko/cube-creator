import type { SingleEditor } from '@hydrofoil/shaperone-core'
import * as ns from '@cube-creator/core/namespace'

export const radioButtons: SingleEditor = {
  term: ns.editor.RadioButtons,
  match (shape) {
    const { in: choices } = shape
    if (choices.length === 0) {
      return 0
    }
    if (choices.length > 5) {
      return null
    }

    return 50
  }
}
