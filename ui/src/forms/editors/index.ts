import { html, SingleEditorComponent, Lazy, MultiEditorComponent } from '@hydrofoil/shaperone-wc'
import {
  EnumSelectEditor, enumSelect as enumSelectCore,
  InstancesSelectEditor, instancesSelect as instancesSelectCore
} from '@hydrofoil/shaperone-core/components'
import * as ns from '@cube-creator/core/namespace'
import { dash, schema, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/dataset'
import { GraphPointer } from 'clownface'
import { FocusNode } from '@hydrofoil/shaperone-core'
import { createCustomElement } from '../custom-element'
import '@rdfine/dash/extensions/sh/PropertyShape'
import { Literal } from 'rdf-js'

async function loadRadioComponent () {
  return import('./RadioButtons.vue').then(createCustomElement('b-radio'))
}

export const textField: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldEditor,
  async lazyRender () {
    await import('./TextFieldEditor.vue').then(createCustomElement('b-textbox'))

    return ({ value }, { update }) => html`<b-textbox .value="${value.object?.value || ''}" .update="${update}"></b-textbox>`
  }
}

export const textFieldWithLang: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldWithLangEditor,
  async lazyRender () {
    await import('./TextFieldWithLangEditor.vue').then(createCustomElement('cc-text-field-with-lang'))

    return ({ value, property }, { update }) => html`<cc-text-field-with-lang
      .value="${value.object?.term}"
      .property="${property}"
      .update="${update}"
    ></cc-text-field-with-lang>`
  }
}

export const textAreaWithLang: Lazy<SingleEditorComponent> = {
  editor: dash.TextAreaWithLangEditor,
  async lazyRender () {
    await import('./TextFieldWithLangEditor.vue').then(createCustomElement('cc-text-field-with-lang'))

    return ({ value, property }, { update }) => html`<cc-text-field-with-lang
      .value="${value.object?.term}"
      .property="${property}"
      .update="${update}"
      input-type="textarea"
    ></cc-text-field-with-lang>`
  }
}

export const instanceSelect: Lazy<InstancesSelectEditor> = {
  ...instancesSelectCore,
  async lazyRender () {
    await import('./SelectEditor.vue').then(createCustomElement('b-select'))

    return ({ property, value }, { update }) => html`<b-select .property="${property.shape}"
                          .update="${update}"
                          .options="${value.componentState.instances}"
                          .value="${value.object?.term}"></b-select>`
  }
}

export const enumSelect: Lazy<EnumSelectEditor> = {
  ...enumSelectCore,
  async lazyRender () {
    await import('./SelectEditor.vue').then(createCustomElement('b-select'))

    return ({ property, value }, { update }) =>
      html`<b-select .property="${property.shape}"
                          .update="${update}"
                          .options="${value.componentState.choices}"
                          .value="${value.object?.term}"></b-select>`
  }
}

export const autoComplete: Lazy<InstancesSelectEditor> = {
  ...instancesSelectCore,
  editor: dash.AutoCompleteEditor,
  async lazyRender () {
    await import('./AutoCompleteEditor.vue').then(createCustomElement('auto-complete'))

    return ({ property, value }, { update }) => html`<auto-complete .property="${property.shape}"
                          .update="${update}"
                          .options="${value.componentState.instances}"
                          .value="${value.object?.term}"></auto-complete>`
  }
}

export const radioButtons: Lazy<SingleEditorComponent> = {
  editor: ns.editor.RadioButtons,
  async lazyRender () {
    await loadRadioComponent()

    return ({ property, value }, { update }) => {
      const items = property.shape.pointer.node(property.shape.in)

      return html`<b-radio .options="${items}" .value="${value.object}" .update="${update}"></b-radio>`
    }
  }
}

export const colorPicker: Lazy<SingleEditorComponent> = {
  editor: ns.editor.ColorPicker,
  async lazyRender () {
    await import('./ColorPicker.vue').then(createCustomElement('color-picker'))

    return ({ value }, { update }) => html`<color-picker .value="${value.object?.value || ''}" .update="${update}"></color-picker>`
  }
}

const trueTerm = $rdf.literal('true', xsd.boolean)

export const checkBox: Lazy<SingleEditorComponent> = {
  editor: ns.editor.Checkbox,
  async lazyRender () {
    await import('./CheckboxEditor.vue').then(createCustomElement('cc-checkbox'))

    return ({ value }, { update }) => {
      const booleanValue = trueTerm.equals(value.object?.term)
      return html`<cc-checkbox .value="${booleanValue}" .update="${update}"></cc-checkbox>`
    }
  },
}

export const uriEditor: Lazy<SingleEditorComponent> = {
  editor: dash.URIEditor,
  async lazyRender () {
    await import('./URIInput.vue').then(createCustomElement('cc-uri-input'))

    return ({ value }, { update }) => html`<cc-uri-input .value="${value.object}" .update="${update}"></cc-uri-input>`
  }
}

export const datePickerEditor: Lazy<SingleEditorComponent> = {
  editor: dash.DatePickerEditor,
  async lazyRender () {
    await import('./DatePickerEditor.vue').then(createCustomElement('cc-date-picker'))

    return ({ value }, { update }) => html`<cc-date-picker .value="${value.object?.value}" .update="${update}"></cc-date-picker>`
  },
}

export const propertyEditor: Lazy<SingleEditorComponent> = {
  editor: ns.editor.PropertyEditor,
  async lazyRender () {
    await import('./PropertyInput.vue').then(createCustomElement('cc-property-input'))

    return ({ value }, { update }) => html`<cc-property-input .value="${value.object?.term}" .update="${update}"></cc-property-input>`
  },
}

function isFocusNode (value?: GraphPointer): value is FocusNode {
  return value?.term.termType === 'NamedNode' || value?.term.termType === 'BlankNode'
}

export const nestedForm: SingleEditorComponent = {
  editor: dash.DetailsEditor,
  render ({ property: { shape: { node } }, value, renderer }) {
    const focusNode = value.object

    if (isFocusNode(focusNode)) {
      return html`<div class="box">${renderer.renderFocusNode({ focusNode, shape: node })}</div>`
    }

    return html``
  }
}

export const identifierTemplateEditor: Lazy<SingleEditorComponent> = {
  editor: ns.editor.IdentifierTemplateEditor,
  async lazyRender () {
    await import('./IdentifierTemplateEditor.vue').then(createCustomElement('identifier-template-editor'))

    return ({ value, updateComponentState, focusNode }, { update }) => {
      let { tableName, isObservationTable, sourceId } = value.componentState

      if (tableName !== focusNode.out(schema.name).value) {
        tableName = focusNode.out(schema.name).value
        updateComponentState({ tableName })
      }

      if (isObservationTable !== focusNode.out(ns.cc.isObservationTable).value) {
        isObservationTable = focusNode.out(ns.cc.isObservationTable).value === 'true'
        updateComponentState({ isObservationTable })
      }

      if (sourceId !== focusNode.out(ns.cc.csvSource).term) {
        sourceId = focusNode.out(ns.cc.csvSource).term
        updateComponentState({ sourceId })
      }

      return html`<identifier-template-editor
        .value="${value.object?.value || ''}"
        .update="${update}"
        .tableName="${tableName}"
        .isObservationTable="${isObservationTable}"
        .sourceId="${sourceId}"
      ></identifier-template-editor>`
    }
  }
}

interface DictionaryTable {
  show?: Literal
}

export const dictionaryTable: Lazy<MultiEditorComponent<DictionaryTable>> = {
  editor: ns.editor.DictionaryTableEditor,
  lazyRender: async function () {
    await loadRadioComponent()
    await import('./DictionaryTableEditor.vue').then(createCustomElement('dictionary-table-editor'))

    return ({ renderer, property: { objects, shape } }) => {
      return html`<dictionary-table-editor
        .shape="${shape}"
        .objects="${objects}"
        .renderer="${renderer}"
      ></dictionary-table-editor>`
    }
  }
}
