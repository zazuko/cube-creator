import type StreamClient from 'sparql-http-client/StreamClient'
import { NamedNode, Quad, Term } from 'rdf-js'
import cf, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import DatasetExt from 'rdf-ext/lib/Dataset'
import { ChangelogDataset } from './ChangelogDataset'
import { CONSTRUCT, INSERT } from '@tpluscode/sparql-builder'
import TermMap from '@rdfjs/term-map'
import { as, hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { warn } from '@hydrofoil/labyrinth/lib/logger'
import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'
import TermSet from '@rdfjs/term-set'
import RdfResource, { RdfResourceCore, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { Link } from '@cube-creator/model/lib/Link'
import * as Activity from './activity/index'

interface ResourceCreationOptions {
  implicitlyDereferencable?: boolean
}

interface GetOptions {
  allowMissing?: boolean
}

/**
 * Represents an in-memory resource store where each resource is a graph pointer.
 * When the `save` method is called those resources are persisted in their respective
 * named graphs in a triple store
 */
export interface ResourceStore {
  /**
   * Gets all triples from a named graph and returns a graph pointer to a resource
   * identified by the same URI
   */
  get(id: string | Term | undefined, opts?: GetOptions): Promise<GraphPointer<NamedNode>>
  get(id: string | Term | undefined, opts: { allowMissing: true }): Promise<GraphPointer<NamedNode> | undefined>

  getResource<T extends RdfResourceCore>(id: string | Term | undefined | Link<T>, opts: { allowMissing: true }): Promise<T> | undefined
  getResource<T extends RdfResourceCore>(id: string | Term | undefined | Link<T>, opts?: GetOptions): Promise<T>

  /**
   * Creates a new resource a puts in the in-memory store
   */
  create(id: Term, options?: ResourceCreationOptions): GraphPointer<NamedNode>

  /**
   * Create a new collection member, initialized according to `hydra:manages` entries
   */
  createMember(collection: Term, id: NamedNode, options?: ResourceCreationOptions): Promise<GraphPointer<NamedNode>>

  /**
   * Removes the named graph from the triple store
   */
  delete(id: NamedNode): void
}

interface TripleStoreFacade {
  loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, ChangelogDataset> | undefined>
  writeChanges(resources: Map<Term, GraphPointer<NamedNode, ChangelogDataset>>, deletedResources: Iterable<NamedNode>, actor?: ResourceIdentifier): Promise<void>
}

function toTriple({ subject, predicate, object }: Quad) {
  return $rdf.quad(subject, predicate, object)
}

export class SparqlStoreFacade implements TripleStoreFacade {
  private readonly __client: StreamClient

  constructor(client: StreamClient, private getUser?: () => NamedNode | undefined) {
    this.__client = client
  }

  async loadResource(term: NamedNode): Promise<GraphPointer<NamedNode, ChangelogDataset<DatasetExt>> | undefined> {
    const stream = await CONSTRUCT`?s ?p ?o`
      .WHERE`GRAPH ${term} { ?s ?p ?o }`
      .execute(this.__client.query)

    const resource = cf({ dataset: new ChangelogDataset(await $rdf.dataset().import(stream)), term })

    if (!resource.dataset.size) {
      return undefined
    }

    return resource
  }

  async writeChanges(resources: Map<NamedNode, GraphPointer<NamedNode, ChangelogDataset>>, deletedResources: Iterable<NamedNode>): Promise<void> {
    const now = Activity.now()
    const actor = this.getUser?.()

    const graphsToDelete = new TermSet([...deletedResources])
    let shouldUpdate = graphsToDelete.size > 0
    const commands: SparqlTemplateResult[] = [...deletedResources]
      .flatMap(id => [...SparqlStoreFacade.deleteResourceCommands(id, now, actor)])

    for (const [id, pointer] of resources.entries()) {
      if (!pointer.dataset.changes.added.size && !pointer.dataset.changes.deleted.size) {
        continue
      }
      shouldUpdate = true

      const queries = pointer.dataset.size === 0
        ? SparqlStoreFacade.deleteResourceCommands(id, now, actor)
        : SparqlStoreFacade.insertResourceCommands(pointer, now, actor)

      for (const query of queries) {
        commands.push(query)
      }
    }

    if (shouldUpdate) {
      const query = commands.reduce((combined, current) => sparql`${combined}\n\n${current};`, sparql``)
      await this.__client.query.update(query.toString())
    }
  }

  private static dropGraphCommand(id: NamedNode) {
    return sparql`DROP SILENT GRAPH ${id}`
  }

  private static * deleteResourceCommands(id: NamedNode, now: Date, actor: NamedNode | undefined) {
    const activity = Activity.newId()

    yield SparqlStoreFacade.dropGraphCommand(id)

    yield INSERT.DATA`
      GRAPH ${activity} {
        ${activity} a ${as.Delete} ;
        ${as.startTime} ${now} ;
        ${as.endTime} ${now} ;
        ${as.object} ${id} ;
        ${actor ? sparql`${as.actor} ${actor}` : ''}
      }`._getTemplateResult()
  }

  private static * insertResourceCommands(pointer: GraphPointer<NamedNode>, now: Date, actor: ResourceIdentifier | undefined) {
    const activity = Activity.newId()

    yield INSERT`
      GRAPH ${activity} {
        ${activity} a ?type ;
        ${as.startTime} ?now ;
        ${as.endTime} ?now ;
        ${as.object} ?object ;
        ${actor ? sparql`${as.actor} ${actor}` : ''}
      }`.WHERE`
        BIND ( ${now} as ?now )
        BIND ( ${pointer.term} as ?object )
        BIND (
          IF(EXISTS { GRAPH ?object { ?object ?p ?o } }, ${as.Update}, ${as.Create}) as ?type
        )
      `._getTemplateResult()

    yield SparqlStoreFacade.dropGraphCommand(pointer.term)

    yield INSERT.DATA`
      GRAPH ${pointer.term} {
        ${[...pointer.dataset].map(toTriple)}
      }
    `._getTemplateResult()
  }
}

export default class implements ResourceStore {
  private readonly __storage: TripleStoreFacade
  private readonly __resources: TermMap<NamedNode, GraphPointer<NamedNode, ChangelogDataset>>
  private readonly __deletedGraphs: TermSet<NamedNode>

  constructor(clientOrStore: StreamClient | TripleStoreFacade) {
    this.__storage = 'store' in clientOrStore ? new SparqlStoreFacade(clientOrStore) : clientOrStore
    this.__resources = new TermMap()
    this.__deletedGraphs = new TermSet()
  }

  async get(id: string | Term | undefined | Link<any>, opts?: GetOptions): Promise<GraphPointer<NamedNode>> {
    let resource: GraphPointer<NamedNode, ChangelogDataset> | undefined
    let term: Term | undefined
    if (typeof id === 'object' && 'id' in id) {
      term = id.id
    } else if (typeof id === 'string') {
      term = $rdf.namedNode(id)
    } else if (typeof id === 'object' && 'termType' in id) {
      term = id
    }

    if (term && term.termType !== 'NamedNode') {
      throw new Error('Loaded resource id must be NamedNode')
    }

    if (term) {
      if (!this.__resources.has(term)) {
        resource = await this.__storage.loadResource(term)
        if (resource) {
          this.__resources.set(term, resource)
        }
      }

      resource = this.__resources.get(term)
    }

    if (!resource) {
      if (opts?.allowMissing) {
        return undefined as any
      }
      throw new Error(`Resource ${term?.value} not found`)
    }

    return resource
  }

  async getResource<T extends RdfResourceCore>(id: string | Term | undefined | Link<T>, opts?: GetOptions):Promise<T | undefined> {
    const pointer = await this.get(id, opts)
    if (!pointer) return undefined

    return RdfResource.factory.createEntity<T>(pointer)
  }

  async save(): Promise<void> {
    await this.__storage.writeChanges(this.__resources, this.__deletedGraphs)
    this.__deletedGraphs.clear()
  }

  create(id: NamedNode, { implicitlyDereferencable = true }: ResourceCreationOptions = {}): GraphPointer<NamedNode, ChangelogDataset> {
    if (id.termType !== 'NamedNode') {
      throw new Error('Resource must be identified by a NamedNode')
    }

    if (this.__resources.has(id)) {
      throw new Error(`Resource <${id.value}> already exists`)
    }

    const pointer = cf({ dataset: new ChangelogDataset($rdf.dataset()), term: id })

    if (implicitlyDereferencable) {
      pointer.addOut(rdf.type, hydra.Resource)
    }

    this.__resources.set(id, pointer)
    return pointer
  }

  async createMember(collectionId: NamedNode, id: NamedNode, options?: ResourceCreationOptions): Promise<GraphPointer<NamedNode, ChangelogDataset>> {
    const member = this.create(id, options)
    const collection = await this.get(collectionId)

    if (!collection) {
      throw new Error(`Collection <${collectionId}> not found`)
    }

    collection.out(hydra.manages).forEach((manages) => {
      const property = manages.out(hydra.property).term
      const subject = manages.out(hydra.subject).term
      const object = manages.out(hydra.object).term

      if (object && subject) {
        warn('hydra:manages cannot have both subject and object. Got %s and %s respectively', subject.value, object.value)
        return
      }

      if (property && object) {
        member.addOut(property, object)
      } else if (property && subject) {
        member.addIn(property, subject)
      }
    })

    return member
  }

  delete(id: NamedNode): void {
    this.__deletedGraphs.add(id)
    this.__resources.delete(id)
  }
}
