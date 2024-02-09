import type { NamedNode, Term } from '@rdfjs/types'
import DatasetExt from 'rdf-ext/lib/Dataset'
import clownface, { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import ResourceStore from '../../lib/ResourceStore'
import { ChangelogDataset } from '../../lib/ChangelogDataset'

class InMemoryStorage {
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode, ChangelogDataset<DatasetExt>>>

  constructor(pointers: Array<GraphPointer<NamedNode, DatasetExt> | RdfResourceCore<DatasetExt>>) {
    this.__resources = new TermMap()
    for (const pointer of pointers) {
      this.push(pointer)
    }
  }

  async loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, ChangelogDataset<DatasetExt>> | undefined> {
    return this.__resources.get(term)
  }

  writeChanges(resources: Map<Term, GraphPointer>, deletedResources: Iterable<NamedNode>): Promise<void> {
    for (const id of deletedResources) {
      this.__resources.delete(id)
    }
    return Promise.resolve()
  }

  push(pointerOrResource: GraphPointer<NamedNode, DatasetExt> | RdfResourceCore<DatasetExt>) {
    const pointer = 'id' in pointerOrResource ? pointerOrResource.pointer : pointerOrResource
    if (pointer.term.termType !== 'NamedNode') {
      throw new Error('Pointer must be named node')
    }

    const changelogPointer = clownface({ dataset: new ChangelogDataset(pointer.dataset) }).node(pointer.term)
    this.__resources.set(pointer.term, changelogPointer)
  }
}

export class TestResourceStore extends ResourceStore {
  constructor(pointers: Array<GraphPointer<NamedNode, DatasetExt> | RdfResourceCore<DatasetExt>>) {
    const resources = new InMemoryStorage(pointers)
    super(resources)
    this.push = (pointer: GraphPointer<any, DatasetExt> | RdfResourceCore<DatasetExt>) => resources.push(pointer)
  }

  readonly push: (pointer: GraphPointer<Term, DatasetExt> | RdfResourceCore<DatasetExt>) => void
}
