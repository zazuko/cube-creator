import app from '../main'

export function createCustomElement (tag: string) {
  return async function (component: any): Promise<void> {
    const vueCustomElement = (await import('vue-custom-element')).default

    app.use(vueCustomElement);

    (app as any).customElement(tag, component.default)
  }
}
