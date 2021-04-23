import clownface, { GraphPointer, MultiPointer } from 'clownface'
import { NamedNode, Quad, Term } from 'rdf-js'
import $rdf from 'rdf-ext'
import { dcterms, hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { DomainError } from '@cube-creator/api-errors'
import env from '../env'
import { SharedDimensionsStore } from '../store'
import httpError from 'http-errors'

interface CreateSharedDimension {
  resource: GraphPointer<NamedNode>
  store: SharedDimensionsStore
}

function newId(base: string, name: string) {
  if (base.endsWith('/')) {
    return $rdf.namedNode(`${base}${name}`)
  }
  return $rdf.namedNode(`${base}/${name}`)
}

function replace(from: NamedNode, to: NamedNode) {
  return (quad: Quad) => {
    const subject = quad.subject.equals(from) ? to : quad.subject
    const object = quad.object.equals(from) ? to : quad.object
    return $rdf.quad(subject, quad.predicate, object, quad.graph)
  }
}

export async function create({ resource, store }: CreateSharedDimension): Promise<GraphPointer> {
  const identifier = resource.out(dcterms.identifier).value
  if (!identifier) {
    throw new DomainError('Missing dimension identifier')
  }

  const termSetId = newId(env.MANAGED_DIMENSIONS_TERM_BASE, identifier)
  if (await store.exists(termSetId, schema.DefinedTermSet)) {
    throw new httpError.Conflict(`Shared Dimension ${identifier} already exists`)
  }

  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, termSetId)))
  const termSet = clownface({ dataset })
    .namedNode(termSetId)
    .addOut(rdf.type, [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension, md.SharedDimension])

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
  shape: MultiPointer
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
    .out(sh.ignoredProperties)
    .list() || []

  for (const ignoredProperty of ignoredProperties) {
    removeSubgraph(resource, ignoredProperty.term)
  }

  await store.save(resource)
  return resource
}
