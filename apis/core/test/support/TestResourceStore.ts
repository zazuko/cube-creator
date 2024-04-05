import type { NamedNode, Term } from '@rdfjs/types'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import type { GraphPointer } from 'clownface'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import $rdf from '@zazuko/env'
import ResourceStore from '../../lib/ResourceStore.js'
import { ChangelogDataset } from '../../lib/ChangelogDataset.js'

class InMemoryStorage {
  private readonly __resources: Map<NamedNode, GraphPointer<NamedNode, ChangelogDataset<DatasetExt>>>

  constructor(pointers: Array<GraphPointer<NamedNode, DatasetExt> | RdfResourceCore<DatasetExt>>) {
    this.__resources = $rdf.termMap()
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

    const changelogPointer = $rdf.clownface({ dataset: new ChangelogDataset(pointer.dataset) }).node(pointer.term)
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
