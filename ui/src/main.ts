import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'
import Oruga from '@oruga-ui/oruga-next'
import { bulmaConfig } from '@oruga-ui/theme-bulma'
import App from './App.vue'
import router from './router'
import './components/tagged-literal'
import { setLanguages } from '@rdfjs-elements/lit-helpers'
import { displayLanguage } from '@/store/serializers'
import { library as iconsLibrary } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import './customElements'
import './styles/app.scss'
import store from './store'

import('./forms')

setLanguages(...displayLanguage)

const app = createApp(App)

app.use(router)
app.use(store)

iconsLibrary.add(fas)
iconsLibrary.add(far)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.use(Oruga, {
  ...bulmaConfig,
  iconPack: 'fas',
  iconComponent: 'FontAwesomeIcon',
  dropdown: {
    ...bulmaConfig.dropdown,
    itemClass: (_: string, { props }: any) => props.itemClass || 'dropdown-item',
  },
  tooltip: {
    ...bulmaConfig.tooltip,
    rootClass: (_: string, { props }: any) => {
      const classes = ['b-tooltip']

      if (props.variant) {
        classes.push(`is-${props.variant}`)
      } else {
        classes.push('is-light')
      }

      if (props.position) classes.push(`is-${props.position}`)

      return classes.join(' ')
    },
  },
})

Sentry.init({
  app,
  dsn: window.APP_CONFIG.sentry?.dsn,
  environment: window.APP_CONFIG.sentry?.environment,
  release: process.env.VUE_APP_SENTRY_RELEASE,
  attachProps: true,
  logErrors: true,
  tracesSampleRate: 1,
  integrations: [
    new Integrations.BrowserTracing({
      tracingOrigins: [window.APP_CONFIG.apiCoreBase, /^\//],
      routingInstrumentation: Sentry.vueRouterInstrumentation(router)
    })
  ],
  tracingOptions: {
    trackComponents: true
  }
})

app.mount('#app')

export default app
