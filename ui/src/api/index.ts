import { Hydra } from 'alcaeus/web'
import { HydraResponse, RdfResource, RuntimeOperation } from 'alcaeus'
import { ResponseWrapper } from 'alcaeus/ResponseWrapper'
import RdfResourceImpl, { RdfResourceCore, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { hydra, sh } from '@tpluscode/rdf-ns-builders'
import { ShapeBundle } from '@rdfine/shacl/bundles'
import { Shape, ValidationReportMixin, ValidationResultMixin } from '@rdfine/shacl'
import { ThingMixin } from '@rdfine/schema'
import { Store } from 'vuex'
import store from '@/store'
import { RootState } from '@/store/types'
import { APIError } from './errors'
import { apiResourceMixin } from './mixins/ApiResource'
import CSVSourceMixin from './mixins/CSVSource'
import TableMixin from './mixins/Table'
import HierarchyMixin from './mixins/Hierarchy'
import JobCollectionMixin from './mixins/JobCollection'
import OperationMixin from './mixins/Operation'
import SharedDimensionMixin from './mixins/SharedDimension'
import * as Models from '@cube-creator/model'
import { findNodes } from 'clownface-shacl-path'
import { FileLiteral } from '@/forms/FileLiteral'
import { GraphPointer } from 'clownface'
import type { Term } from '@rdfjs/types'

export const rootURL = window.APP_CONFIG.apiCoreBase
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
Hydra.resources.factory.addMixin(HierarchyMixin)
Hydra.resources.factory.addMixin(JobCollectionMixin)
Hydra.resources.factory.addMixin(OperationMixin)
Hydra.resources.factory.addMixin(SharedDimensionMixin)
Hydra.resources.factory.addMixin(...ShapeBundle)
Hydra.resources.factory.addMixin(ThingMixin)
Hydra.resources.factory.addMixin(ValidationReportMixin)
Hydra.resources.factory.addMixin(ValidationResultMixin)

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

  async fetchOperationShape (operation: RuntimeOperation, { targetClass }: { targetClass?: Term } = {}): Promise<Shape | null> {
    const expects: RdfResource | undefined = operation.expects
      .find(expects => 'load' in expects && expects.types.has(sh.Shape))

    const headers: HeadersInit = {}
    if (targetClass) {
      headers.Prefer = `target-class=${targetClass.value}`
    }

    if (expects && expects.load) {
      const { representation } = await expects.load<Shape>(headers)
      if (representation && representation.root) {
        return representation.root
      }
    }

    return null
  },

  prepareOperationBody (data: RdfResource, operation: RuntimeOperation): { body: File | FormData | string; contentHeaders: HeadersInit } {
    const embeddedFiles = operation.multiPartPaths
      .reduce((previous, { pointer: path }) => {
        return [
          ...previous,
          ...findNodes(data.pointer, path).toArray()
        ]
      }, [] as GraphPointer[])

    const body = JSON.stringify(data.toJSON())

    if (embeddedFiles.length) {
      const formData = new FormData()
      formData.append('representation', new Blob([body], {
        type: 'application/ld+json'
      }))

      for (const file of embeddedFiles) {
        const term = file.term instanceof FileLiteral ? file.term : null
        if (term) {
          formData.append(term.value, term.file)
        }
      }

      return {
        body: formData,
        // not setting 'multipart/form-data' because the browser will do that
        // only this way the multipart boundary is set automatically
        contentHeaders: {},
      }
    }

    return {
      body,
      contentHeaders: { 'content-type': 'application/ld+json' }
    }
  },

  async invokeSaveOperation<T extends RdfResource = RdfResource> (operation: RuntimeOperation | null | undefined, resource: RdfResource | GraphPointer<ResourceIdentifier>, headers: HeadersInit = {}): Promise<T | null | undefined> {
    const data = 'toJSON' in resource
      ? resource
      : RdfResourceImpl.factory.createEntity(resource) as RdfResource

    if (!operation) throw new Error('Operation does not exist')

    const { body, contentHeaders } = this.prepareOperationBody(data, operation)
    const response = await operation.invoke<T>(body, {
      ...contentHeaders,
      ...headers,
    })

    if (!response.response?.xhr.ok) {
      throw await APIError.fromResponse(response)
    }

    const responseResource = response.representation?.root
    if (response.response.xhr.status === 201 && !responseResource) {
      throw new Error('Response does not contain created resource')
    }

    return responseResource
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

export function prepareHeaders (uri: string, store: Store<RootState>): Record<string, string> {
  const headers: Record<string, string> = {}

  if (!uri.startsWith(rootURL)) {
    return headers
  }

  const token = store.state.auth.access_token
  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  if (process.env.VUE_APP_X_USER) {
    headers['x-user'] = process.env.VUE_APP_X_USER
  }

  if (process.env.VUE_APP_X_PERMISSION) {
    headers['x-permission'] = process.env.VUE_APP_X_PERMISSION
  }

  return headers
}
