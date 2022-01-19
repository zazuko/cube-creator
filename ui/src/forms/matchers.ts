import type { MultiEditor, SingleEditor } from '@hydrofoil/shaperone-core'
import * as ns from '@cube-creator/core/namespace'
import { prov, xsd } from '@tpluscode/rdf-ns-builders'

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

export const dictionaryTable: MultiEditor = {
  term: ns.editor.DictionaryTableEditor,
  match (shape) {
    if (Array.isArray(shape.path)) {
      return 0
    }

    if (shape.path?.equals(prov.hadDictionaryMember)) {
      return 80
    }

    return 0
  }
}

// todo: should return null or be removed altogether after https://github.com/hypermedia-app/shaperone/issues/156
export const fileUpload: MultiEditor = {
  term: ns.editor.FileUpload,
  match () {
    return 0
  }
}

// todo: should return null or be removed altogether after https://github.com/hypermedia-app/shaperone/issues/156
export const tagsWithLanguage: MultiEditor = {
  term: ns.editor.TagsWithLanguageEditor,
  match (shape) {
    if (shape.editor?.equals(ns.editor.TagsWithLanguageEditor)) {
      return 100
    }

    return 0
  }
}

// todo: should return null or be removed altogether after https://github.com/hypermedia-app/shaperone/issues/156
export const checkboxList: MultiEditor = {
  term: ns.editor.CheckboxListEditor,
  match (shape) {
    if (shape.editor?.equals(ns.editor.CheckboxListEditor)) {
      return 100
    }

    return 0
  }
}
