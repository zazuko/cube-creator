import { renderer, components, editors } from '@hydrofoil/shaperone-wc/configure'
import { html } from 'lit-element'
import { repeat } from 'lit-html/directives/repeat'
import { PropertyTemplate, ObjectTemplate, FocusNodeTemplate } from '@hydrofoil/shaperone-wc/templates'
import { instancesSelector } from '@hydrofoil/shaperone-hydra/components'
import { ShaperoneForm } from '@hydrofoil/shaperone-wc/ShaperoneForm'
import * as Editors from './editors'
import * as Matchers from './matchers'
import { Metadata } from './metadata'
import { createCustomElement } from './custom-element'
import { dash } from '@tpluscode/rdf-ns-builders'
import { fieldIf } from '@/forms/decorators'

export const focusNode: FocusNodeTemplate = (renderer, { focusNode }) => html`
  <div class="fieldset" part="focus-node">
    ${repeat(focusNode.groups, group => renderer.renderGroup({ group }))}
  </div>
`

const property: PropertyTemplate = (renderer, { property }) => {
  return html`<form-property
    .property="${Object.freeze(property)}"
    .renderObject="${renderer.renderObject.bind(renderer)}"
    .actions="${renderer.actions}"
    .renderMultiEditor="${renderer.renderMultiEditor.bind(renderer)}"
  ></form-property>`
}

property.loadDependencies = () => [
  import('./FormProperty.vue').then(createCustomElement('form-property')),
]

export const object: ObjectTemplate = (renderer, { object }) => {
  return html`<form-object
    .object="${object}"
    .property="${Object.freeze(renderer.property)}"
    .actions="${renderer.actions}"
    .renderEditor="${renderer.renderEditor.bind(renderer)}"
  />`
}

object.loadDependencies = () => [
  import('./FormObject.vue').then(createCustomElement('form-object')),
]

renderer.setTemplates({
  focusNode,
  property,
  object,
})
components.pushComponents(Editors)
components.decorate({
  ...instancesSelector.decorator(),
  applicableTo ({ editor }) {
    return editor.equals(dash.InstancesSelectEditor) || editor.equals(dash.AutoCompleteEditor)
  },
})
components.decorate(fieldIf)

editors.addMatchers(Matchers)
editors.decorate(instancesSelector.matcher)
editors.addMetadata(Metadata)

class Form extends ShaperoneForm {
  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }
}

customElements.define('cc-form', Form)
