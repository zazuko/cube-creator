import { renderer, components, editors } from '@hydrofoil/shaperone-wc/configure'
import { html } from 'lit-element'
import { repeat } from 'lit-html/directives/repeat'
import { DefaultStrategy } from '@hydrofoil/shaperone-wc/renderer/DefaultStrategy'
import { PropertyRenderStrategy, ObjectRenderStrategy, FocusNodeRenderStrategy } from '@hydrofoil/shaperone-wc/lib/renderer'
import { instancesSelector } from '@hydrofoil/shaperone-hydra/components'
import { ShaperoneForm } from '@hydrofoil/shaperone-wc/ShaperoneForm'
import * as Editors from './editors'
import * as Matchers from './matchers'
import { Metadata } from './metadata'
import { createCustomElement } from './custom-element'
import { dash } from '@tpluscode/rdf-ns-builders'
import { fieldIf } from '@/forms/decorators'

export const focusNodeStrategy: FocusNodeRenderStrategy = ({ focusNode, renderGroup }) => html`
  <div class="fieldset" part="focus-node">
    ${repeat(focusNode.groups, renderGroup)}
  </div>
`

const propertyStrategy: PropertyRenderStrategy = ({ property, actions, renderObject, renderMultiEditor }) => {
  return html`<form-property
    .property="${Object.freeze(property)}"
    .renderObject="${renderObject}"
    .actions="${actions}"
    .renderMultiEditor="${renderMultiEditor}"
  ></form-property>`
}

propertyStrategy.loadDependencies = () => [
  import('./FormProperty.vue').then(createCustomElement('form-property')),
]

export const objectStrategy: ObjectRenderStrategy = ({ object, actions, renderEditor, property }) => {
  return html`<form-object
    .object="${object}"
    .property="${Object.freeze(property)}"
    .actions="${actions}"
    .renderEditor="${renderEditor}"
  />`
}

objectStrategy.loadDependencies = () => [
  import('./FormObject.vue').then(createCustomElement('form-object')),
]

renderer.setStrategy({
  ...DefaultStrategy,
  focusNode: focusNodeStrategy,
  property: propertyStrategy,
  object: objectStrategy,
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
