import TermMap from '@rdfjs/term-map'
import { rdf } from '@tpluscode/rdf-ns-builders'
import sinon from 'sinon'
import $rdf from 'rdf-ext'
import { SharedDimensionsStore } from '../../lib/store'

export function testStore(): SharedDimensionsStore {
  const resources = new TermMap()

  const store: SharedDimensionsStore = {
    graph: $rdf.namedNode('https://lindas.admin.ch/cube/dimension'),
    async load(term) {
      return term && resources.get(term)
    },
    async save(resource) {
      resources.set(resource.term, resource)
    },
    async delete(term) {
      resources.delete(term)
    },
    async exists(term, type) {
      const resource = await this.load(term)

      return resource?.has(rdf.type, type).terms.length > 0
    },
  }

  return sinon.spy(store)
}
