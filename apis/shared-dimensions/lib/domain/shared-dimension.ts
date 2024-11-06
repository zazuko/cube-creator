import type { NamedNode, Quad, Stream, Term } from '@rdfjs/types'
import clownface, { GraphPointer, MultiPointer } from 'clownface'
import $rdf from 'rdf-ext'
import through2 from 'through2'
import { dcterms, hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { DomainError } from '@cube-creator/api-errors'
import httpError from 'http-errors'
import { DESCRIBE, SELECT } from '@tpluscode/sparql-builder'
import { StreamClient } from 'sparql-http-client/StreamClient'
import { oa } from '@tpluscode/rdf-ns-builders/strict'
import TermSet from '@rdfjs/term-set'
import { parsingClient, streamClient } from '../sparql'
import { SharedDimensionsStore } from '../store'
import env from '../env'
import { newId, replace } from './resource'
import * as queries from './shared-dimension/queries'

export { importDimension } from './shared-dimension/import'

interface Contributor {
  name: string
  email?: string
}

interface CreateSharedDimension {
  resource: GraphPointer<NamedNode>
  store: SharedDimensionsStore
  contributor: Contributor
}

export async function create({ resource, store, contributor }: CreateSharedDimension): Promise<GraphPointer> {
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

  setDefaultContributor(termSet, contributor)

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
  queries?: typeof queries
  contributor: Contributor
}

function removeSubgraph(pointer: GraphPointer, predicate?: Term) {
  const children = pointer.out(predicate).toArray()
  pointer.deleteOut(predicate)

  for (const child of children) {
    removeSubgraph(child)
  }
}

export async function update({ resource, store, shape, queries, contributor }: UpdateSharedDimension): Promise<GraphPointer> {
  const ignoredProperties = shape
    ?.out(sh.ignoredProperties)
    .list() || []

  for (const ignoredProperty of ignoredProperties) {
    removeSubgraph(resource, ignoredProperty.term)
  }

  const current = await store.load(resource.term)
  const deletedProperties = new TermSet(current.out(schema.additionalProperty).out(rdf.predicate).terms)
  for (const prop of resource.out(schema.additionalProperty).out(rdf.predicate).terms) {
    deletedProperties.delete(prop)
  }

  setDefaultContributor(resource, contributor)

  await store.save(resource)
  await queries?.deleteDynamicTerms({
    dimension: resource.term,
    properties: [...deletedProperties],
    graph: env.MANAGED_DIMENSIONS_GRAPH,
  })
  return resource
}

function setDefaultContributor(termSet: GraphPointer, contributor: Contributor) {
  if (termSet.out(dcterms.contributor).terms.length === 0) {
    termSet.addOut(dcterms.contributor, contributorPtr => {
      contributorPtr.addOut(schema.name, contributor.name)
      if (contributor.email) {
        contributorPtr.addOut(schema.email, contributor.email)
      }
    })
  }
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

export async function getExportedDimension({ resource, store, client = streamClient }: GetExportedDimension): Promise<ExportedDimension> {
  const dimension = await store.load(resource)

  const quads = await DESCRIBE`${resource} ?term`
    .FROM(store.graph)
    .WHERE`
      ?term ${schema.inDefinedTermSet} ${resource}
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
    .import(quads.pipe(transformToQuads))

  for (const excludedProp of excludedProps) {
    materialized.removeMatches(null, excludedProp)
  }

  return {
    dimension,
    data: materialized.toStream(),
  }
}

export async function getDynamicProperties(sharedDimensions: Term[], client = parsingClient): Promise<Term[]> {
  const bindings = await SELECT`?property`
    .WHERE`
      ?dimension ${schema.additionalProperty}/${rdf.predicate} ?property
    `
    .execute(client.query)

  return bindings.map(b => b.property)
}
