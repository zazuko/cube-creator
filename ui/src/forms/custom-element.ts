import { defineCustomElement } from './vue-custom-element'

export function createCustomElement (tag: string) {
  return async function (componentModule: any): Promise<void> {
    const component = 'default' in componentModule ? componentModule.default : componentModule

    const customElement = defineCustomElement(component, { shadowRoot: false })

    defineOnce(tag, customElement)
  }
}

function defineOnce (tagName: string, customElement: CustomElementConstructor) {
  const existingCustomElement = customElements.get(tagName)
  return typeof existingCustomElement !== 'undefined'
    ? existingCustomElement
    : customElements.define(tagName, customElement)
}
