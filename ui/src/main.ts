import Vue from 'vue'
import Buefy from 'buefy'
import App from './App.vue'
import router from './router'

import { library as iconsLibrary } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import './styles/app.scss'
import store from './store'

import('./forms')

iconsLibrary.add(fas)
iconsLibrary.add(far)
Vue.component('FontAwesomeIcon', FontAwesomeIcon)

Vue.use(Buefy, {
  defaultIconPack: 'fas',
  defaultIconComponent: 'FontAwesomeIcon',
  defaultTooltipType: 'is-light',
  defaultTooltipDelay: 200,
})

Vue.config.productionTip = false

Vue.filter('format-date', (date: Date) => date.toLocaleString())

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
