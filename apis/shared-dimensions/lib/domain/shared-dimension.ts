import { BlankNode, NamedNode, Quad, Stream, Term } from 'rdf-js'
import clownface, { GraphPointer, MultiPointer } from 'clownface'
import $rdf from 'rdf-ext'
import through2 from 'through2'
import { dcterms, hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { DomainError } from '@cube-creator/api-errors'
import httpError from 'http-errors'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { StreamClient } from 'sparql-http-client/StreamClient'
import TermMap from '@rdfjs/term-map'
import { oa } from '@tpluscode/rdf-ns-builders/strict'
import { streamClient } from '../sparql'
import { SharedDimensionsStore } from '../store'
import env from '../env'
import { resourceShapePatterns } from '../resource'
import { newId, replace } from './resource'

export { importDimension } from './shared-dimension/import'

interface CreateSharedDimension {
  resource: GraphPointer<NamedNode>
  store: SharedDimensionsStore
}

export async function create({ resource, store }: CreateSharedDimension): Promise<GraphPointer> {
  const identifier = resource.out(dcterms.identifier).value
  if (!identifier) {
    throw new DomainError('Missing dimension identifier')
  }

  const termSetId = newId(env.MANAGED_DIMENSIONS_BASE, `dimension/${identifier}`)
  if (await store.exists(termSetId, schema.DefinedTermSet)) {
    throw new httpError.Conflict(`Shared Dimension ${identifier} already exists`)
  }

  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, termSetId)))
  const termSet = clownface({ dataset })
    .namedNode(termSetId)
    .addOut(rdf.type, [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension, md.SharedDimension])
    .deleteOut(md.createAs)

  await store.save(termSet)
  return termSet
}

interface CreateTerm {
  resource: GraphPointer<NamedNode>
  termSet: GraphPointer<NamedNode>
  store: SharedDimensionsStore
}

export async function createTerm({ termSet, resource, store }: CreateTerm): Promise<GraphPointer> {
  const identifier = resource.out(dcterms.identifier).value
  if (!identifier) {
    throw new DomainError('Missing term id')
  }

  const termId = newId(termSet.value, identifier)
  if (await store.exists(termId, schema.DefinedTerm)) {
    throw new httpError.Conflict(`Term ${identifier} already exists`)
  }

  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, termId)))
  const term = clownface({ dataset })
    .namedNode(termId)
    .deleteOut(dcterms.identifier)
    .addOut(schema.inDefinedTermSet, termSet)
    .addOut(rdf.type, [schema.DefinedTerm, hydra.Resource, md.SharedDimensionTerm])

  if (!term.has(schema.validFrom).term) {
    term.addOut(schema.validFrom, termSet.out(schema.validFrom))
  }

  await store.save(term)
  return term
}

interface UpdateSharedDimension {
  resource: GraphPointer<NamedNode>
  store: SharedDimensionsStore
  shape: MultiPointer | undefined
}

function removeSubgraph(pointer: GraphPointer, predicate?: Term) {
  const children = pointer.out(predicate).toArray()
  pointer.deleteOut(predicate)

  for (const child of children) {
    removeSubgraph(child)
  }
}

export async function update({ resource, store, shape }: UpdateSharedDimension): Promise<GraphPointer> {
  const ignoredProperties = shape
    ?.out(sh.ignoredProperties)
    .list() || []

  for (const ignoredProperty of ignoredProperties) {
    removeSubgraph(resource, ignoredProperty.term)
  }

  await store.save(resource)
  return resource
}

interface GetExportedDimension {
  resource: NamedNode
  store: SharedDimensionsStore
  client?: StreamClient
}

interface ExportedDimension {
  dimension: GraphPointer
  data: Stream
}

const excludedProps = [
  md.export,
  md.terms,
  oa.canonical,
]

function urnToBlanks() {
  const urns = new TermMap<Term, BlankNode>()

  return through2.obj(function (quad: Quad, _, next) {
    let { subject, predicate, object, graph } = quad

    if (subject.value.startsWith('urn:')) {
      const blank = urns.get(subject) || $rdf.blankNode()
      urns.set(subject, blank)
      subject = blank
    }
    if (object.value.startsWith('urn:')) {
      const blank = urns.get(object) || $rdf.blankNode()
      urns.set(object, blank)
      object = blank
    }

    this.push($rdf.quad(subject, predicate, object, graph))
    next()
  })
}

export async function getExportedDimension({ resource, store, client = streamClient }: GetExportedDimension): Promise<ExportedDimension> {
  const dimension = await store.load(resource)

  const dimensionAndTerms = sparql`?term ${schema.inDefinedTermSet}* ${dimension.term} .`

  const quads = await CONSTRUCT`?dimensionTerm ?p ?o`
    .FROM(store.graph)
    .WHERE`
      ${resourceShapePatterns(dimensionAndTerms)}

      ?shape ${sh.property} ?shProp .
      ?shProp ${sh.path} ?p .
      ?shape ${sh.targetNode} ?dimensionTerm .
      ?dimensionTerm ?p ?o .

      FILTER (?p NOT ${IN(...excludedProps)})
  `.execute(client.query)

  const baseUriPattern = new RegExp(`^${env.MANAGED_DIMENSIONS_BASE}`)
  function removeBase<T extends Term>(term: T): T {
    if (term.termType === 'NamedNode') {
      return $rdf.namedNode(term.value.replace(baseUriPattern, '')) as any
    }

    return term
  }

  const transformToQuads = through2.obj(function (quad: Quad, _, callback) {
    this.push($rdf.quad(
      removeBase(quad.subject),
      removeBase(quad.predicate),
      removeBase(quad.object),
      removeBase(quad.graph),
    ))
    callback()
  })

  const materialized = await $rdf.dataset()
    .import(quads.pipe(transformToQuads).pipe(urnToBlanks()))

  return {
    dimension,
    data: materialized.toStream(),
  }
}
