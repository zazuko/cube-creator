import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import TermMap from '@rdfjs/term-map'
import Impl, { ResourceStore } from '../../lib/ResourceStore'
import TermSet from '@rdfjs/term-set'

export class TestResourceStore implements ResourceStore {
  private readonly resources: TermMap<NamedNode, GraphPointer<NamedNode>>
  private readonly __deletedGraphs: TermSet

  constructor(pointers: GraphPointer<NamedNode>[]) {
    this.resources = new TermMap()
    this.__deletedGraphs = new TermSet()
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
    this.__deletedGraphs.forEach((id) => this.resources.delete(id as NamedNode))
    this.__deletedGraphs.clear()

    return Promise.resolve()
  }

  delete(id: NamedNode): void {
    this.__deletedGraphs.add(id)
  }
}
