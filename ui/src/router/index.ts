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
import CubeProjectEdit from '@/views/CubeProjectEdit.vue'
import CSVMapping from '@/views/CSVMapping.vue'
import CSVUpload from '@/views/CSVUpload.vue'
import SourceEdit from '@/views/SourceEdit.vue'
import TableCreate from '@/views/TableCreate.vue'
import ColumnMappingEdit from '@/views/ColumnMappingEdit.vue'
import CubeDesigner from '@/views/CubeDesigner.vue'
import CubeMetadataEdit from '@/views/CubeMetadataEdit.vue'
import Pipeline from '@/views/Pipeline.vue'
import PageNotFound from '@/views/PageNotFound.vue'
import Logout from '@/views/Logout.vue'
import NotAuthorized from '@/views/NotAuthorized.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Authenticated,
    redirect: { name: 'CubeProjects' },
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
        children: [
          {
            path: 'edit',
            name: 'CubeProjectEdit',
            component: CubeProjectEdit,
          },
          {
            path: 'csv-mapping',
            name: 'CSVMapping',
            component: CSVMapping,
            children: [
              {
                path: 'csv-upload',
                name: 'CSVUpload',
                component: CSVUpload,
              },
              {
                path: 'sources/:sourceId/edit',
                name: 'SourceEdit',
                component: SourceEdit,
              },
              {
                path: 'tables/create',
                name: 'TableCreate',
                component: TableCreate,
              },
              {
                path: 'column-mappings/:columnMappingId/edit',
                name: 'ColumnMappingEdit',
                component: ColumnMappingEdit,
              },
            ],
          },
          {
            path: 'metadata',
            name: 'CubeDesigner',
            component: CubeDesigner,
            children: [
              {
                path: 'edit',
                name: 'CubeMetadataEdit',
                component: CubeMetadataEdit,
              }
            ],
          },
          {
            path: 'pipeline',
            name: 'Pipeline',
            component: Pipeline,
          },
        ],
      },
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
  {
    path: '/unauthorized',
    name: 'NotAuthorized',
    component: NotAuthorized,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

if (!process.env.VUE_APP_E2E) {
  router.beforeEach(vuexOidcCreateRouterMiddleware(store, 'auth'))
}

export default router
