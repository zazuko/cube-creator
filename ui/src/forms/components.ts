import { html, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import * as ns from '@cube-creator/core/namespace'
import { dash } from '@tpluscode/rdf-ns-builders'
import { createCustomElement } from '@/forms/bulma'
import { hashi } from '@cube-creator/core/namespace'

export const textField: SingleEditorComponent = {
  editor: dash.TextFieldEditor,
  render ({ value }, { update }) {
    return html`<b-textbox .value="${value.object.value}" .update="${update}"></b-textbox>`
  },
  loadDependencies () {
    return [
      import('./BulmaTextBox.vue').then(createCustomElement('b-textbox'))
    ]
  }
}

export const instanceSelect: SingleEditorComponent = {
  editor: dash.InstancesSelectEditor,
  render ({ property, value }, { update }) {
    return html`<b-select .collection="${property.shape.get(hashi.collection)}"
                          .update="${update}"></b-select>`
  },
  loadDependencies () {
    return [
      import('./BulmaSelect.vue').then(createCustomElement('b-select'))
    ]
  }
}

export const radioButtons: SingleEditorComponent = {
  editor: ns.editor.RadioButtons,
  render ({ property, value }, { update }) {
    const items = property.shape.pointer.node(property.shape.in)

    return html`<b-radio .options="${items}" .value="${value.object}" .update="${update}"></b-radio>`
  },
  loadDependencies () {
    return [
      import('./BulmaRadioButtons.vue').then(createCustomElement('b-radio'))
    ]
  }
}

export const colorPicker: SingleEditorComponent = {
  editor: ns.editor.ColorPicker,
  render ({ value }, { update }) {
    return html`<color-picker .value="${value.object.value}" .update="${update}"></color-picker>`
  },
  loadDependencies () {
    return [
      import('./ColorPicker.vue').then(createCustomElement('color-picker'))
    ]
  }
}
