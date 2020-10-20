import type { SingleEditor } from '@hydrofoil/shaperone-core'
import { editor } from '@/forms/bulma'

export const radioButtons: SingleEditor = {
  term: editor.RadioButtons,
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
