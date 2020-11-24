import { html, SingleEditorComponent, Lazy } from '@hydrofoil/shaperone-wc'
import * as ns from '@cube-creator/core/namespace'
import { dash, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/data-model'
import { createCustomElement } from '@/forms/bulma'

export const textField: Lazy<SingleEditorComponent> = {
  editor: dash.TextFieldEditor,
  async lazyRender () {
    await import('./BulmaTextBox.vue').then(createCustomElement('b-textbox'))

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

export const instanceSelect: Lazy<SingleEditorComponent> = {
  editor: dash.InstancesSelectEditor,
  async lazyRender () {
    await import('./BulmaSelect.vue').then(createCustomElement('b-select'))

    return ({ property, value }, { update }) => html`<b-select .property="${property.shape}"
                          .update="${update}"
                          .value="${value.object?.term}"></b-select>`
  }
}

export const enumSelect: Lazy<SingleEditorComponent> = {
  editor: dash.EnumSelectEditor,
  async lazyRender () {
    await import('./BulmaSelect.vue').then(createCustomElement('b-select'))

    return ({ property, value }, { update }) =>
      html`<b-select .property="${property.shape}"
                          .update="${update}"
                          .value="${value.object?.term}"></b-select>`
  }
}

export const radioButtons: Lazy<SingleEditorComponent> = {
  editor: ns.editor.RadioButtons,
  async lazyRender () {
    await import('./BulmaRadioButtons.vue').then(createCustomElement('b-radio'))

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
    await import('./BulmaCheckbox.vue').then(createCustomElement('cc-checkbox'))

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

export const propertyEditor: Lazy<SingleEditorComponent> = {
  editor: ns.editor.PropertyEditor,
  async lazyRender () {
    await import('./PropertyInput.vue').then(createCustomElement('cc-property-input'))

    return ({ value }, { update }) => html`<cc-property-input .value="${value.object?.term}" .update="${update}"></cc-property-input>`
  },
}

export const nestedForm: SingleEditorComponent = {
  editor: dash.DetailsEditor,
  render ({ property, value }) {
    const nestedShape = property.shape?.node?.pointer

    return html`<cc-form .resource="${value.object}" .shapes="${nestedShape}" class="box"></cc-form>`
  }
}
