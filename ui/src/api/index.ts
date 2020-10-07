import { Hydra } from 'alcaeus/web'
import { HydraResource } from 'alcaeus'
import store from '@/store'
import { APIError } from './errors'
import { apiResourceMixin } from './mixins/ApiResource'

const rootURL = window.APP_CONFIG.apiCoreBase
const segmentSeparator = '!!' // used to replace slash in URI to prevent escaping

if (!rootURL) {
  throw new Error('Missing API_CORE_BASE setting')
}

// Tells Hydra to use the API root URI as base URI for relative URIs
Hydra.baseUri = rootURL

Hydra.resources.factory.addMixin(apiResourceMixin(rootURL, segmentSeparator))

// Inject the access token in all requests if present
Hydra.defaultHeaders = () => {
  const headers = new Headers()

  const token = store.state.auth.access_token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

export const api = {
  async fetchResource (url: string): Promise<HydraResource> {
    const response = await Hydra.loadResource(url.replace(segmentSeparator, '/'))

    if (response.response?.xhr.status !== 200) {
      throw await APIError.fromResponse(response)
    }

    const resource = response.representation?.root
    if (!resource) {
      throw new Error('Response does not contain resource')
    }

    return resource
  }
}
