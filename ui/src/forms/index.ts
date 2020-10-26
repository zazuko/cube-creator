import { renderer, components, editors } from '@hydrofoil/shaperone-wc/configure'
import { html } from 'lit-element'
import { DefaultStrategy } from '@hydrofoil/shaperone-wc/renderer/DefaultStrategy'
import { PropertyRenderStrategy, ObjectRenderStrategy } from '@hydrofoil/shaperone-wc/lib/renderer'
import { ShaperoneForm } from '@hydrofoil/shaperone-wc/ShaperoneForm'
import * as Components from './components'
import * as Matchers from './matchers'
import { Metadata } from './metadata'
import { createCustomElement } from '@/forms/bulma'

const propertyStrategy: PropertyRenderStrategy = ({ property, actions, renderObject, renderMultiEditor }) => {
  return html`<form-property
    .property="${property}"
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
    .property="${property}"
    .actions="${actions}"
    .renderEditor="${renderEditor}"
  />`
}

objectStrategy.loadDependencies = () => [
  import('./FormObject.vue').then(createCustomElement('form-object')),
]

renderer.setStrategy({
  ...DefaultStrategy,
  property: propertyStrategy,
  object: objectStrategy,
})
components.pushComponents(Components)

editors.addMatchers(Matchers)
editors.addMetadata(Metadata)

class Form extends ShaperoneForm {
  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }
}

customElements.define('cc-form', Form)
