import { Hydra } from 'alcaeus/web'
import { RdfResource, Resource, RuntimeOperation } from 'alcaeus'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { sh } from '@tpluscode/rdf-ns-builders'
import { ShapeBundle } from '@rdfine/shacl/bundles'
import { Shape } from '@rdfine/shacl'
import store from '@/store'
import { APIError } from './errors'
import { apiResourceMixin } from './mixins/ApiResource'
import ProjectsCollectionMixin from './mixins/ProjectsCollection'
import ProjectMixin from './mixins/Project'
import CSVMappingMixin from './mixins/CSVMapping'
import CSVSourceCollectionMixin from './mixins/CSVSourceCollection'
import CSVSourceMixin from './mixins/CSVSource'
import CSVColumnMixin from './mixins/CSVColumn'
import TableCollectionMixin from './mixins/TableCollection'
import TableMixin from './mixins/Table'
import ColumnMappingMixin from './mixins/ColumnMapping'
import JobCollectionMixin from './mixins/JobCollection'
import { JobMixin } from '@cube-creator/model/Job'

const rootURL = window.APP_CONFIG.apiCoreBase
const segmentSeparator = '!!' // used to replace slash in URI to prevent escaping

if (!rootURL) {
  throw new Error('Missing API_CORE_BASE setting')
}

// Tells Hydra to use the API root URI as base URI for relative URIs
Hydra.baseUri = rootURL

Hydra.resources.factory.addMixin(apiResourceMixin(rootURL, segmentSeparator))
Hydra.resources.factory.addMixin(ProjectsCollectionMixin)
Hydra.resources.factory.addMixin(ProjectMixin)
Hydra.resources.factory.addMixin(CSVMappingMixin)
Hydra.resources.factory.addMixin(CSVSourceCollectionMixin)
Hydra.resources.factory.addMixin(CSVSourceMixin)
Hydra.resources.factory.addMixin(CSVColumnMixin)
Hydra.resources.factory.addMixin(TableCollectionMixin)
Hydra.resources.factory.addMixin(TableMixin)
Hydra.resources.factory.addMixin(ColumnMappingMixin)
Hydra.resources.factory.addMixin(JobCollectionMixin)
Hydra.resources.factory.addMixin(JobMixin)
Hydra.resources.factory.addMixin(...ShapeBundle)

// Inject the access token in all requests if present
Hydra.defaultHeaders = () => {
  const headers = new Headers()

  headers.set('Content-Type', 'application/ld+json')

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

export const api = {
  async fetchResource <T extends RdfResourceCore = RdfResource> (url: string): Promise<T> {
    const response = await Hydra.loadResource<T>(url.replace(segmentSeparator, '/'))

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
    const response = await operation.invoke(serializedData, headers)

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
  }
}
