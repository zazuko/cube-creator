import { NamedNode, Stream } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import ResourceStore from '../../lib/ResourceStore'

class InMemoryStorage {
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode, DatasetExt>>

  constructor(pointers: GraphPointer<NamedNode, DatasetExt>[]) {
    this.__resources = new TermMap()
    for (const pointer of pointers) {
      this.__resources.set(pointer.term, pointer)
    }
  }

  async loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, DatasetExt> | undefined> {
    return this.__resources.get(term)
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async writeResources(stream: Stream): Promise<void> {}

  deleteResources(terms: Iterable<NamedNode>): Promise<void> {
    for (const id of terms) {
      this.__resources.delete(id)
    }
    return Promise.resolve()
  }
}

export class TestResourceStore extends ResourceStore {
  constructor(pointers: GraphPointer<NamedNode, DatasetExt>[]) {
    super(new InMemoryStorage(pointers))
  }
}
