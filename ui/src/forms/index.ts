import { Hydra } from 'alcaeus/web'
import * as Shaperone from '@hydrofoil/shaperone-wc/configure'
import { html } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { FocusNodeTemplate, GroupTemplate, ObjectTemplate, PropertyTemplate } from '@hydrofoil/shaperone-wc/templates'
import setup from '@hydrofoil/shaperone-hydra'
import { ShaperoneForm } from '@hydrofoil/shaperone-wc/ShaperoneForm'
import * as Editors from './editors'
import * as Viewers from './viewers'
import * as Matchers from './matchers'
import { Metadata } from './metadata'
import * as decorators from '@/forms/decorators'
import * as dictionaryEditor from './templates/dictionaryEditor'
import * as dynamicXone from './templates/dynamicXone'
import emptyPropertyHider from './templates/emptyPropertyHider'
import validation from '@/forms/validation'

export const focusNode: FocusNodeTemplate = (renderer, { focusNode }) => {
  const tabs = () => html`
    <div class="tabs is-boxed is-highlighted">
      <ul>
        ${repeat(focusNode.groups, (group) => {
    const hasErrors = focusNode.properties.find(p => p.shape.group?.equals(group.group) && p.validationResults.length > 0)

    return html`
            <li class="${group.selected ? 'is-active' : ''} is-error">
              <a href="#" class="tab-link"
                 @click="${() => renderer.actions.selectGroup(group.group)}"
                 style="color: ${hasErrors ? 'red' : 'auto'}"
              >
                ${group.group?.label ?? '-'}
              </a>
            </li>
          `
  })}
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
  <div class="${activeClass}" style="display: var(--cc-form-group-display); justify-content: var(--cc-form-group-justify-content)">
    ${repeat(properties, property => renderer.renderProperty({ property }))}
  </div>
  `
}

const property: PropertyTemplate = (renderer, { property }) => {
  const linkAttrs = {
    target: '_blank',
    rel: 'noopener noreferrer nofollow',
  }

  const controls = property.selectedEditor
    ? renderer.renderMultiEditor()
    : property.objects.map(object => html`${renderer.renderObject({ object })}`)
  const isRequired = property.shape.minCount && property.shape.minCount > 0

  return html`<form-property
    .canAdd="${property.canAdd}"
    .actions="${renderer.actions}"
    @add="${renderer.actions.addObject}"
    .violations="${property.validationResults}"
    .isRequired="${isRequired}"
  >
    <span class="label" slot="label">
      ${property.name} ${property.name && isRequired ? '*' : ''}
    </span>
    <markdown-render slot="help-text" class="help" .anchorAttributes="${linkAttrs}" .source="${property.shape.description}" ></markdown-render>
    ${controls}
  </form-property>`
}

property.loadDependencies = () => [
  import('../customElements/FormProperty'),
]

export const object: ObjectTemplate = (renderer, { object }) => {
  return html`<form-object
    .canRemove="${renderer.property.canRemove}"
    @remove="${renderer.actions.remove}"
    .violations="${object.validationResults}"
  >
    ${renderer.renderEditor()}
  </form-object>`
}

object.loadDependencies = () => [
  import('../customElements/FormObject')
]

Shaperone.renderer.setTemplates({
  focusNode: dynamicXone.focusNode(dictionaryEditor.focusNode(focusNode)),
  property: emptyPropertyHider(dictionaryEditor.property(property)),
  object,
  group,
})
Shaperone.components.pushComponents(Editors)
Shaperone.components.pushComponents(Viewers)
setup(Shaperone, { client: Hydra })
Object.values(decorators).forEach(Shaperone.components.decorate)

Shaperone.editors.addMetadata(Metadata)
Shaperone.editors.addMatchers(Matchers)
Shaperone.validation.setValidator(validation)

class Form extends ShaperoneForm {
  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }
}

customElements.define('cc-form', Form)
