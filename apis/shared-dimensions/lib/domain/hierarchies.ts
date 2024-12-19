import type { NamedNode } from '@rdfjs/types'
import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { md, meta } from '@cube-creator/core/namespace'
import clownface, { GraphPointer } from 'clownface'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import httpError from 'http-errors'
import $rdf from 'rdf-ext'
import slugify from 'slugify'
import { DomainError } from '@cube-creator/api-errors'
import { SharedDimensionsStore } from '../store'
import env from '../env'
import { textSearch } from '../query'
import { newId, replace } from './resource'

interface GetHierarchies {
  freetextQuery: string | undefined
  limit: number
  offset: number
}

export function getHierarchies({ freetextQuery, limit, offset }: GetHierarchies) {
  const hierarchy = $rdf.variable('hierarchy')
  const name = $rdf.variable('name')

  let select = SELECT.DISTINCT`${hierarchy}`
    .WHERE`
      ${hierarchy} a ${md.Hierarchy} ; ${schema.name} ${name} .
    `

  if (freetextQuery) {
    select = select
      .WHERE`${textSearch(hierarchy, schema.name, freetextQuery)}`
      .LIMIT(limit)
      .OFFSET(offset)
      .ORDER().BY(name)
  }

  return CONSTRUCT`
    ?proxyUrl ?p ?o .
  `
    .WHERE`
      {
        ${select}
      }

      ${hierarchy} ?p ?o .

      BIND(IRI(CONCAT("${env.MANAGED_DIMENSIONS_API_BASE}", "dimension/_hierarchy/proxy?id=", ENCODE_FOR_URI(STR(${hierarchy})))) AS ?proxyUrl)
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
