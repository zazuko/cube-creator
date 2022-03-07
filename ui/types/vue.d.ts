
declare module 'vue' {
  import { CompatVue } from '@vue/runtime-dom'
  const Vue: CompatVue
  export default Vue
  export * from '@vue/runtime-dom'

  // export default interface Vue extends CompatVue {
  //   $store: any
  //   $router: any
  //   $route: any
  // }
}
