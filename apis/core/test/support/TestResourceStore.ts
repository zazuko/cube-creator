import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import { ResourceStore } from '../../lib/ResourceStore'

export class TestResourceStore implements ResourceStore {
  private readonly resources: TermMap<NamedNode, GraphPointer<NamedNode>>

  constructor(pointers: GraphPointer<NamedNode>[]) {
    this.resources = new TermMap()

    for (const pointer of pointers) {
      this.resources.set(pointer.term, pointer)
    }
  }

  get(id: string | NamedNode): Promise<GraphPointer<NamedNode>> {
    const resource = this.resources.get(typeof id === 'string' ? $rdf.namedNode(id) : id)
    if (!resource) {
      return Promise.resolve(clownface({ dataset: $rdf.dataset() }).namedNode(id))
    }

    return Promise.resolve(resource)
  }

  put(pointer: GraphPointer<NamedNode>): Promise<void> {
    return Promise.resolve()
  }
}
