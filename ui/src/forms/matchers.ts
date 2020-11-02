import type { SingleEditor } from '@hydrofoil/shaperone-core'
import * as ns from '@cube-creator/core/namespace'
import { xsd } from '@tpluscode/rdf-ns-builders'

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

export const checkBox: SingleEditor = {
  term: ns.editor.Checkbox,
  match (shape) {
    const { datatype } = shape

    if (xsd.boolean.equals(datatype?.id)) {
      return 10
    }

    return 0
  }
}
