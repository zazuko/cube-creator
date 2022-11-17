import { createRouter, createWebHistory, LocationQuery, RouteLocation, RouteRecordRaw } from 'vue-router'
import { vuexOidcCreateRouterMiddleware } from 'vuex-oidc'

import OidcCallback from '@/components/auth/OidcCallback.vue'
import OidcError from '@/components/auth/OidcError.vue'
import store from '@/store'
import Authenticated from '@/views/Authenticated.vue'
import CubeProjects from '@/views/CubeProjects.vue'
import CubeProject from '@/views/CubeProject.vue'
import CubeProjectCreate from '@/views/CubeProjectCreate.vue'
import CubeProjectEdit from '@/views/CubeProjectEdit.vue'
import CSVMapping from '@/views/CSVMapping.vue'
import CSVUpload from '@/views/CSVUpload.vue'
import CSVReplace from '@/views/CSVReplace.vue'
import Job from '@/views/Job.vue'
import SourceEdit from '@/views/SourceEdit.vue'
import TableCreate from '@/views/TableCreate.vue'
import TableEdit from '@/views/TableEdit.vue'
import TableCsvw from '@/views/TableCsvw.vue'
import ColumnMappingEdit from '@/views/ColumnMappingEdit.vue'
import ColumnMappingCreate from '@/views/ColumnMappingCreate.vue'
import CubeDesigner from '@/views/CubeDesigner.vue'
import CubeMetadataEdit from '@/views/CubeMetadataEdit.vue'
import DimensionEdit from '@/views/DimensionEdit.vue'
import DimensionMapping from '@/views/DimensionMapping.vue'
import DimensionMappingImport from '@/views/DimensionMappingImport.vue'
import ResourcePreview from '@/views/ResourcePreview.vue'
import Materialize from '@/views/Materialize.vue'
import MaterializeJobs from '@/views/MaterializeJobs.vue'
import Publication from '@/views/Publication.vue'
import PublicationJobs from '@/views/PublicationJobs.vue'
import PageNotFound from '@/views/PageNotFound.vue'
import Logout from '@/views/Logout.vue'
import NotAuthorized from '@/views/NotAuthorized.vue'
import SharedDimensions from '@/views/SharedDimensions.vue'
import SharedDimension from '@/views/SharedDimension.vue'
import SharedDimensionCreate from '@/views/SharedDimensionCreate.vue'
import SharedDimensionTermCreate from '@/views/SharedDimensionTermCreate.vue'
import SharedDimensionTermEdit from '@/views/SharedDimensionTermEdit.vue'
import SharedDimensionEdit from '@/views/SharedDimensionEdit.vue'
import Hierarchies from '@/views/Hierarchies.vue'
import HierarchyCreate from '@/views/HierarchyCreate.vue'
import Hierarchy from '@/views/Hierarchy.vue'
import HierarchyEdit from '@/views/HierarchyEdit.vue'
import { IriTemplate, RuntimeOperation } from 'alcaeus'
import { GraphPointer } from 'clownface'
import { hydraBox } from '@cube-creator/core/namespace'

const routes: Array<RouteRecordRaw> = [
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
            name: 'CubeProjectCreate',
            component: CubeProjectCreate,
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
                path: 'sources/:sourceId/replace-csv',
                name: 'SourceReplaceCSV',
                component: CSVReplace,
              },
              {
                path: 'tables/create',
                name: 'TableCreate',
                component: TableCreate,
              },
              {
                path: 'tables/:tableId/edit',
                name: 'TableEdit',
                component: TableEdit,
              },
              {
                path: 'tables/:tableId/csvw',
                name: 'TableCsvw',
                component: TableCsvw,
              },
              {
                path: 'column-mappings/:columnMappingId/edit',
                name: 'ColumnMappingEdit',
                component: ColumnMappingEdit,
              },
              {
                path: 'tables/:tableId/column-mappings/create',
                name: 'ColumnMappingCreate',
                component: ColumnMappingCreate,
              },
            ],
          },
          {
            path: 'materialize',
            name: 'Materialize',
            component: Materialize,
          },
          {
            path: 'materialize/jobs',
            name: 'MaterializeJobs',
            component: MaterializeJobs,
            children: [
              {
                path: ':jobId',
                name: 'MaterializeJob',
                component: Job,
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
              },
              {
                path: 'dimension/:dimensionId/edit',
                name: 'DimensionEdit',
                component: DimensionEdit,
              },
              {
                path: 'dimension/:dimensionId/map',
                name: 'DimensionMapping',
                component: DimensionMapping,
              },
              {
                path: 'dimension/:dimensionId/map-import',
                name: 'DimensionMappingImport',
                component: DimensionMappingImport,
              },
              {
                path: 'resource/:resourceId',
                name: 'ResourcePreview',
                component: ResourcePreview,
              },
            ],
          },
          {
            path: 'publication',
            name: 'Publication',
            component: Publication,
          },
          {
            path: 'publication/jobs',
            name: 'PublicationJobs',
            component: PublicationJobs,
            children: [
              {
                path: ':jobId',
                name: 'PublicationJob',
                component: Job,
              },
            ],
          },
        ],
      },
      {
        path: '/shared-dimensions',
        name: 'SharedDimensions',
        component: SharedDimensions,
        children: [
          {
            path: 'new',
            name: 'SharedDimensionCreate',
            component: SharedDimensionCreate,
          },
        ],
      },
      {
        path: '/shared-dimensions/:id',
        name: 'SharedDimension',
        component: SharedDimension,
        children: [
          {
            path: 'edit',
            name: 'SharedDimensionEdit',
            component: SharedDimensionEdit,
          },
          {
            path: 'terms/new',
            name: 'SharedDimensionTermCreate',
            component: SharedDimensionTermCreate,
          },
          {
            path: 'terms/:termId/edit',
            name: 'SharedDimensionTermEdit',
            component: SharedDimensionTermEdit,
          }
        ],
      },
      {
        path: '/hierarchies',
        name: 'Hierarchies',
        component: Hierarchies,
        children: [
          {
            path: 'new',
            name: 'HierarchyCreate',
            component: HierarchyCreate,
          },
        ],
      },
      {
        path: '/hierarchies/:id',
        name: 'Hierarchy',
        component: Hierarchy,
        children: [{
          path: 'edit',
          name: 'HierarchyEdit',
          component: HierarchyEdit
        }]
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
    path: '/logout',
    name: 'Logout',
    component: Logout,
  },
  {
    path: '/unauthorized',
    name: 'NotAuthorized',
    component: NotAuthorized,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'PageNotFound',
    component: PageNotFound,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

if (!process.env.VUE_APP_E2E) {
  router.beforeEach(vuexOidcCreateRouterMiddleware(store, 'auth'))
}

export default router

/**
 * Replicates the route "active" matching behavior of vue-router 3.x.
 *
 * Copied from https://github.com/vuejs/rfcs/blob/master/active-rfcs/0028-router-active-link.md#motivation
 */
export function isRouteActive (route: RouteLocation, currentRoute: RouteLocation) {
  return currentRoute.path.startsWith(route.path) && includesQuery(currentRoute.query, route.query)
}

export function getRouteSearchParamsFromTemplatedOperation (operation: RuntimeOperation, searchPointer: GraphPointer) {
  const template = operation.get<IriTemplate>(hydraBox.variables)
  const url = template.expand(searchPointer)
  const search = new URLSearchParams(url.substring(url.indexOf('?')))
  const entries = [...search.entries()].filter(([, value]) => !!value && value !== '""')

  return Object.fromEntries(entries)
}

function includesQuery (outter: LocationQuery, inner: LocationQuery): boolean {
  for (const key in inner) {
    const innerValue = inner[key]
    const outterValue = outter[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outterValue) return false
    } else {
      if (
        !Array.isArray(outterValue) ||
        outterValue.length !== innerValue?.length ||
        innerValue.some((value, i) => value !== outterValue[i])
      ) {
        return false
      }
    }
  }

  return true
}
