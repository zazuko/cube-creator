import { html, SingleEditorComponent } from '@hydrofoil/shaperone-wc'
import * as ns from '@cube-creator/core/namespace'
import { dash, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/data-model'
import { createCustomElement } from '@/forms/bulma'

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
    return html`<b-select .property="${property.shape}"
                          .update="${update}"
                          .value="${value.object.term}"></b-select>`
  },
  loadDependencies () {
    return [
      import('./BulmaSelect.vue').then(createCustomElement('b-select'))
    ]
  }
}

export const enumSelect: SingleEditorComponent = {
  editor: dash.EnumSelectEditor,
  render ({ property, value }, { update }) {
    return html`<b-select .property="${property.shape}"
                          .update="${update}"
                          .value="${value.object.term}"></b-select>`
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

const trueTerm = $rdf.literal('true', xsd.boolean)

export const checkBox: SingleEditorComponent = {
  editor: ns.editor.Checkbox,
  render ({ value }, { update }) {
    const booleanValue = trueTerm.equals(value.object.term)
    return html`<cc-checkbox .value="${booleanValue}" .update="${update}"></cc-checkbox>`
  },
  loadDependencies () {
    return [
      import('./BulmaCheckbox.vue').then(createCustomElement('cc-checkbox'))
    ]
  }
}

export const uriEditor: SingleEditorComponent = {
  editor: dash.URIEditor,
  render ({ value }, { update }) {
    return html`<cc-uri-input .value="${value.object}" .update="${update}"></cc-uri-input>`
  },
  loadDependencies () {
    return [
      import('./URIInput.vue').then(createCustomElement('cc-uri-input'))
    ]
  }
}

export const propertyEditor: SingleEditorComponent = {
  editor: ns.editor.PropertyEditor,
  render ({ value }, { update }) {
    return html`<cc-property-input .value="${value.object.term}" .update="${update}"></cc-property-input>`
  },
  loadDependencies () {
    return [
      import('./PropertyInput.vue').then(createCustomElement('cc-property-input'))
    ]
  }
}

export const nestedForm: SingleEditorComponent = {
  editor: dash.DetailsEditor,
  render ({ property, value }) {
    const nestedShape = property.shape?.node?.pointer

    return html`<cc-form .resource="${value.object}" .shapes="${nestedShape}" class="box"></cc-form>`
  }
}
