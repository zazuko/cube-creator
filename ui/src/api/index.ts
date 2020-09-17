import { Hydra } from 'alcaeus/web'
import { HydraResource } from 'alcaeus'
import store from '@/store'
import { APIError } from './errors'

const rootURL = process.env.VUE_APP_API_URL

if (!rootURL) {
  throw new Error('Missing VUE_APP_API_URL setting')
}

// Tells Hydra to use the API root URI as base URI for relative URIs
Hydra.baseUri = rootURL

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
    const response = await Hydra.loadResource(url)

    if (response?.response?.xhr.status !== 200) {
      throw await APIError.fromResponse(response)
    }

    const resource = response.representation?.root
    if (!resource) {
      throw new Error('Response does not contain resource')
    }

    return resource
  }
}
