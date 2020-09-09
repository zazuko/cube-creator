import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { vuexOidcCreateRouterMiddleware } from 'vuex-oidc'

import OidcCallback from '@/components/auth/OidcCallback.vue'
import OidcError from '@/components/auth/OidcError.vue'
import store from '@/store'
import Home from '@/views/Home.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/oidc-callback',
    name: 'OidcCallback',
    component: OidcCallback,
  },
  {
    path: '/oidc-error',
    name: 'OidcError',
    component: OidcError,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(vuexOidcCreateRouterMiddleware(store, 'auth'))

export default router
