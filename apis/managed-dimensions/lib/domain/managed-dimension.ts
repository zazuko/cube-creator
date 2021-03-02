import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Quad } from 'rdf-js'
import $rdf from 'rdf-ext'
import UrlSlugify from 'url-slugify'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { meta } from '@cube-creator/core/namespace'
import { DomainError } from '@cube-creator/api-errors'
import env from '../env'
import { ManagedDimensionsStore } from '../store'

interface CreateSharedDimension {
  resource: GraphPointer<NamedNode>
  store: ManagedDimensionsStore
}

function newId(base: string, name: string) {
  return $rdf.namedNode(`${base}/${new UrlSlugify().slugify(name)}`)
}

function replace(from: NamedNode, to: NamedNode) {
  return (quad: Quad) => {
    const subject = quad.subject.equals(from) ? to : quad.subject
    const object = quad.object.equals(from) ? to : quad.object
    return $rdf.quad(subject, quad.predicate, object, quad.graph)
  }
}

export async function create({ resource, store }: CreateSharedDimension): Promise<GraphPointer> {
  const name = resource.out(schema.name, { language: ['en', '*'] }).value
  if (!name) {
    throw new DomainError('Missing dimension name')
  }

  const termSetId = newId(`${env.MANAGED_DIMENSIONS_BASE}term-set`, name)
  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, termSetId)))
  const termSet = clownface({ dataset })
    .namedNode(termSetId)
    .addOut(rdf.type, [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension])

  await store.save(termSet)
  return termSet
}

interface CreateTerm {
  resource: GraphPointer<NamedNode>
  termSet: GraphPointer<NamedNode>
  store: ManagedDimensionsStore
}

export async function createTerm({ termSet, resource, store }: CreateTerm): Promise<GraphPointer> {
  const name = resource.out(schema.name, { language: ['en', '*'] }).value
  if (!name) {
    throw new DomainError('Missing term name')
  }

  const termId = newId(termSet.value, name)
  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, termId)))
  const term = clownface({ dataset })
    .namedNode(termId)
    .addOut(schema.inDefinedTermSet, termSet)
    .addOut(rdf.type, [schema.DefinedTerm, hydra.Resource])

  if (!term.has(schema.validFrom).term) {
    term.addOut(schema.validFrom, termSet.out(schema.validFrom))
  }

  await store.save(term)
  return term
}
