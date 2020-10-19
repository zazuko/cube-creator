import ResourceStoreImpl, { ResourceStore } from '../ResourceStore'
import { streamClient } from '../query-client'

export function resourceStore(): ResourceStore {
  return new ResourceStoreImpl(streamClient)
}
