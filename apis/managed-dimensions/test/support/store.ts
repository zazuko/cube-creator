import TermMap from '@rdfjs/term-map'
import sinon from 'sinon'
import { ManagedDimensionsStore } from '../../lib/store'

export function testStore(): ManagedDimensionsStore {
  const resources = new TermMap()

  const store: ManagedDimensionsStore = {
    async load(term) {
      return term && resources.get(term)
    },
    async save(resource) {
      resources.set(resource.term, resource)
    },
    async delete(term) {
      resources.delete(term)
    },
  }

  return sinon.spy(store as any) as any
}
