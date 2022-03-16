import { NamedNode } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { md, meta } from '@cube-creator/core/namespace'
import clownface, { GraphPointer } from 'clownface'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import httpError from 'http-errors'
import $rdf from 'rdf-ext'
import slugify from 'slugify'
import { DomainError } from '@cube-creator/api-errors'
import { SharedDimensionsStore } from '../store'
import env from '../env'
import { newId, replace } from './resource'

export function getHierarchies() {
  return CONSTRUCT`
    ?h ?p ?o .
  `
    .WHERE`
      ?h a ${md.Hierarchy} .
      ?h ?p ?o .
    `
}

interface CreateHierarchy {
  resource: GraphPointer<NamedNode>
  store: SharedDimensionsStore
}

export async function create({ resource, store }: CreateHierarchy) {
  const name = resource.out(schema.name).value
  if (!name) {
    throw new DomainError('Missing hierarchy name')
  }

  const identifier = slugify(name, {
    lower: true,
    trim: true,
  })

  const hierarchyId = newId(env.MANAGED_DIMENSIONS_BASE, `dimension/hierarchy/${identifier}`)
  if (await store.exists(hierarchyId, schema.DefinedTermSet)) {
    throw new httpError.Conflict('Hierarchy already exists')
  }

  const dataset = $rdf.dataset([...resource.dataset].map(replace(resource.term, hierarchyId)))
  const hierarchy = clownface({ dataset })
    .namedNode(hierarchyId)
    .addOut(rdf.type, [hydra.Resource, meta.Hierarchy, md.Hierarchy])

  await store.save(hierarchy)
  return hierarchy
}
