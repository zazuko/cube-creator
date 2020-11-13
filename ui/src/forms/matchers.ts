import type { SingleEditor } from '@hydrofoil/shaperone-core'
import * as ns from '@cube-creator/core/namespace'
import { dash, rdf, xsd } from '@tpluscode/rdf-ns-builders'

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

// TODO: Remove once shaperone supports it
export const textFieldWithLang: SingleEditor = {
  term: dash.TextFieldWithLangEditor,
  match (shape, value) {
    const valueDatatype = (value.term.termType === 'Literal' && value.term?.datatype) || null
    const propertyDatatype = shape.datatype?.id

    if (
      valueDatatype?.equals(rdf.langString) ||
      propertyDatatype?.equals(rdf.langString) ||
      propertyDatatype?.equals(xsd.string)
    ) {
      return 10
    }

    return 0
  },
}
