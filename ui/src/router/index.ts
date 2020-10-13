import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import { vuexOidcCreateRouterMiddleware } from 'vuex-oidc'

import OidcCallback from '@/components/auth/OidcCallback.vue'
import OidcError from '@/components/auth/OidcError.vue'
import store from '@/store'
import Authenticated from '@/views/Authenticated.vue'
import CubeProjects from '@/views/CubeProjects.vue'
import CubeProject from '@/views/CubeProject.vue'
import CubeProjectNew from '@/views/CubeProjectNew.vue'
import PageNotFound from '@/views/PageNotFound.vue'
import Logout from '@/views/Logout.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Authenticated,
    children: [
      {
        path: '/cube-projects',
        name: 'CubeProjects',
        component: CubeProjects,
        children: [
          {
            path: 'new',
            name: 'CubeProjectNew',
            component: CubeProjectNew,
          },
        ],
      },
      {
        path: '/cube-projects/:id',
        name: 'CubeProject',
        component: CubeProject,
      }
    ],
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
  {
    path: '*',
    name: 'PageNotFound',
    component: PageNotFound,
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach(vuexOidcCreateRouterMiddleware(store, 'auth'))

export default router
