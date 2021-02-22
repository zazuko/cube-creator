import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Quad } from 'rdf-js'
import $rdf from 'rdf-ext'
import UrlSlugify from 'url-slugify'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import { DomainError } from '@cube-creator/api-errors'
import env from '../env'
import { ManagedDimensionsStore } from '../store'

interface CreateSharedDimension {
  resource: GraphPointer<NamedNode>
  store: ManagedDimensionsStore
}

function newId(name: string) {
  return $rdf.namedNode(`${env.MANAGED_DIMENSIONS_BASE}term-set/${new UrlSlugify().slugify(name)}`)
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

  const termSetId = newId(name)
  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, termSetId)))
  const termSet = clownface({ dataset })
    .namedNode(termSetId)
    .addOut(rdf.type, [hydra.Resource, schema.DefinedTermSet, meta.SharedDimension, md.ManagedDimension])

  await store.save(termSet)
  return termSet
}
