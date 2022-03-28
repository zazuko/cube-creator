import { renderer, components, editors } from '@hydrofoil/shaperone-wc/configure'
import { html } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { PropertyTemplate, ObjectTemplate, FocusNodeTemplate, GroupTemplate } from '@hydrofoil/shaperone-wc/templates'
import { instancesSelector } from '@hydrofoil/shaperone-hydra/components'
import { ShaperoneForm } from '@hydrofoil/shaperone-wc/ShaperoneForm'
import * as Editors from './editors'
import * as Viewers from './viewers'
import * as Matchers from './matchers'
import { Metadata } from './metadata'
import { createCustomElement } from './custom-element'
import { dash } from '@tpluscode/rdf-ns-builders'
import * as decorators from '@/forms/decorators'
import * as dictionaryEditor from './templates/dictionaryEditor'
import * as dynamicXone from './templates/dynamicXone'
import emptyPropertyHider from './templates/emptyPropertyHider'

export const focusNode: FocusNodeTemplate = (renderer, { focusNode }) => {
  const tabs = () => html`
    <div class="tabs is-boxed is-highlighted">
      <ul>
        ${repeat(focusNode.groups, group => html`
          <li class="${group.selected ? 'is-active' : ''}">
            <a href="#" class="tab-link" @click="${() => renderer.actions.selectGroup(group.group)}">
              ${group.group?.label ?? '-'}
            </a>
          </li>
        `)}
      </ul>
    </div>
  `
  const showTabs = focusNode.groups.length > 1

  return html`
    ${showTabs ? tabs() : ''}
    ${repeat(focusNode.groups, group => renderer.renderGroup({ group }))}
  `
}

export const group: GroupTemplate = (renderer, { properties }) => {
  const activeClass = renderer.group.selected ? '' : 'is-hidden'

  return html`
  <div class="${activeClass}">
    ${repeat(properties, property => renderer.renderProperty({ property }))}
  </div>
  `
}

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
  focusNode: dynamicXone.focusNode(dictionaryEditor.focusNode(focusNode)),
  property: emptyPropertyHider(dictionaryEditor.property(property)),
  object,
  group,
})
components.pushComponents(Editors)
components.pushComponents(Viewers)
components.decorate({
  ...instancesSelector.decorator(),
  applicableTo ({ editor }) {
    return editor.equals(dash.InstancesSelectEditor) || editor.equals(dash.AutoCompleteEditor)
  },
})
Object.values(decorators).forEach(components.decorate)

editors.addMetadata(Metadata)
editors.addMatchers(Matchers)
editors.decorate(instancesSelector.matcher)

class Form extends ShaperoneForm {
  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }
}

customElements.define('cc-form', Form)
