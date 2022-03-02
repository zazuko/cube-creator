import Vue from 'vue'

export function createCustomElement (tag: string) {
  return async function (component: any): Promise<void> {
    const vueCustomElement = (await import('vue-custom-element')).default

    Vue.use(vueCustomElement)

    Vue.customElement(tag, component.default)
  }
}
