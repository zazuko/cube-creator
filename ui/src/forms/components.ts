import { html, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import { dash } from '@tpluscode/rdf-ns-builders'
import { editor, createCustomElement } from '@/forms/bulma'

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

export const radioButtons: SingleEditorComponent = {
  editor: editor.RadioButtons,
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
