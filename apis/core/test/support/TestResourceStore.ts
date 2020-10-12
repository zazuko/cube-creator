import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import Impl, { ResourceStore } from '../../lib/ResourceStore'

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

  create(id: NamedNode): GraphPointer<NamedNode> {
    return clownface({ dataset: $rdf.dataset() }).namedNode(id)
  }

  async createMember(collection: NamedNode, id: NamedNode): Promise<GraphPointer<NamedNode>> {
    return Impl.prototype.createMember.call(this, collection, id)
  }

  save(): Promise<void> {
    return Promise.resolve()
  }
}
