import ns from '@rdf-esm/namespace'
import Vue from 'vue'
import { cc } from '@cube-creator/core/namespace'

export const editor = ns(cc.dash.value)

export function createCustomElement (tag: string) {
  return async function (Component: any) {
    const vueCustomElement = (await import('vue-custom-element')).default

    Vue.use(vueCustomElement)

    // eslint-disable-next-line new-cap
    Vue.customElement(tag, (new Component.default().$options))
  }
}
