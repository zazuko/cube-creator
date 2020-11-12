import { NamedNode, Term } from 'rdf-js'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import ResourceStore from '../../lib/ResourceStore'

class InMemoryStorage {
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode, DatasetExt>>

  constructor(pointers: GraphPointer<NamedNode, DatasetExt>[]) {
    this.__resources = new TermMap()
    for (const pointer of pointers) {
      this.push(pointer)
    }
  }

  async loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, DatasetExt> | undefined> {
    return this.__resources.get(term)
  }

  writeChanges(resources: Map<Term, GraphPointer>, deletedResources: Iterable<NamedNode>): Promise<void> {
    for (const id of deletedResources) {
      this.__resources.delete(id)
    }
    return Promise.resolve()
  }

  push(pointer: GraphPointer<NamedNode, DatasetExt>) {
    this.__resources.set(pointer.term, pointer)
  }
}

export class TestResourceStore extends ResourceStore {
  constructor(pointers: GraphPointer<NamedNode, DatasetExt>[]) {
    const resources = new InMemoryStorage(pointers)
    super(resources)
    this.push = (pointer: GraphPointer<any, DatasetExt>) => resources.push(pointer)
  }

  readonly push: (pointer: GraphPointer<Term, DatasetExt>) => void
}
