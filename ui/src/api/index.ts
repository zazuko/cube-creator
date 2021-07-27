import { Hydra } from 'alcaeus/web'
import { HydraResponse, RdfResource, RuntimeOperation } from 'alcaeus'
import { ResponseWrapper } from 'alcaeus/ResponseWrapper'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { hydra, sh } from '@tpluscode/rdf-ns-builders'
import { ShapeBundle } from '@rdfine/shacl/bundles'
import type { Shape } from '@rdfine/shacl'
import { Store } from 'vuex'
import store from '@/store'
import { RootState } from '@/store/types'
import { APIError } from './errors'
import { apiResourceMixin } from './mixins/ApiResource'
import CSVSourceMixin from './mixins/CSVSource'
import TableMixin from './mixins/Table'
import JobCollectionMixin from './mixins/JobCollection'
import * as Models from '@cube-creator/model'

const rootURL = window.APP_CONFIG.apiCoreBase
const segmentSeparator = '!!' // used to replace slash in URI to prevent escaping

if (!rootURL) {
  throw new Error('Missing API_CORE_BASE setting')
}

// Tells Hydra to use the API root URI as base URI for relative URIs
Hydra.baseUri = rootURL

Hydra.resources.factory.addMixin(...Object.values(Models))
Hydra.resources.factory.addMixin(apiResourceMixin(rootURL, segmentSeparator))
Hydra.resources.factory.addMixin(CSVSourceMixin)
Hydra.resources.factory.addMixin(TableMixin)
Hydra.resources.factory.addMixin(JobCollectionMixin)
Hydra.resources.factory.addMixin(...ShapeBundle)

// Inject the access token in all requests if present
Hydra.defaultHeaders = ({ uri }) => prepareHeaders(uri, store)

// Cache API documentation because we know that it doesn't ever change.
Hydra.cacheStrategy.shouldLoad = (previous) => {
  return !previous.representation.root?.types.has(hydra.ApiDocumentation)
}

const pendingRequests = new Map<string, Promise<HydraResponse<any, any>>>()

export const api = {
  async fetchResource <T extends RdfResourceCore = RdfResource> (url: string): Promise<T> {
    let request = pendingRequests.get(url)
    if (!request) {
      request = Hydra.loadResource<T>(url.split(segmentSeparator).join('/'))
      pendingRequests.set(url, request)
    }

    const response = await request
    pendingRequests.delete(url)

    if (response.response?.xhr.status !== 200) {
      throw await APIError.fromResponse(response)
    }

    const resource = response.representation?.root
    if (!resource) {
      throw new Error('Response does not contain resource')
    }

    return resource
  },

  async fetchOperationShape (operation: RuntimeOperation): Promise<Shape | null> {
    const expects: RdfResource | undefined = operation.expects
      .find(expects => 'load' in expects && expects.types.has(sh.Shape))

    if (expects && expects.load) {
      const { representation } = await expects.load<Shape>()
      if (representation && representation.root) {
        return representation.root
      }
    }

    return null
  },

  async invokeSaveOperation<T extends RdfResource = RdfResource> (operation: RuntimeOperation | null, data: RdfResource | File, headers: Record<string, string> = {}): Promise<T> {
    if (!operation) throw new Error('Operation does not exist')

    const serializedData = data instanceof File ? data : JSON.stringify(data.toJSON())
    const response = await operation.invoke(serializedData, {
      'content-type': 'application/ld+json',
      ...headers,
    })

    if (!response.response?.xhr.ok) {
      throw await APIError.fromResponse(response)
    }

    // TODO: Is there anything I can do to avoid casting as `unknown`?
    const resource: unknown = response.representation?.root
    if (!resource) {
      throw new Error('Response does not contain created resource')
    }

    return resource as T
  },

  async invokeDeleteOperation (operation: RuntimeOperation | null): Promise<void> {
    if (!operation) throw new Error('Operation does not exist')

    const response = await operation.invoke('')

    if (response.response?.xhr.status !== 204) {
      throw await APIError.fromResponse(response)
    }
  },

  async invokeDownloadOperation (operation: RuntimeOperation | null, headers: Record<string, string> = {}): Promise<ResponseWrapper> {
    if (!operation) throw new Error('Operation does not exist')

    const response = await operation.invoke('', headers)

    if (response.response?.xhr.status !== 305) {
      throw await APIError.fromResponse(response)
    }

    return response.response
  },
}

export function prepareHeaders (uri: string, store: Store<RootState>): Headers {
  const headers = new Headers()

  if (!uri.startsWith(rootURL)) {
    return headers
  }

  const token = store.state.auth.access_token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (process.env.VUE_APP_X_USER) {
    headers.set('X-User', process.env.VUE_APP_X_USER)
  }

  if (process.env.VUE_APP_X_PERMISSION) {
    headers.set('X-Permission', process.env.VUE_APP_X_PERMISSION)
  }

  return headers
}
