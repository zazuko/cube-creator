import { asyncMiddleware } from 'middleware-async'
import { md } from '@cube-creator/core/namespace'
import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import { hydra } from '@tpluscode/rdf-ns-builders'
import $rdf from '@cube-creator/env'
import httpError from 'http-errors'
import { parsingClient } from '../sparql.js'
import { getHierarchies, create } from '../domain/hierarchies.js'
import { shaclValidate } from '../middleware/shacl.js'
import { rewrite } from '../rewrite.js'
import { store } from '../store.js'
import { getCollection } from './collection.js'

export const get = asyncMiddleware(async (req, res, next) => {
  if (!req.dataset) {
    return next(new httpError.BadRequest())
  }

  const query = $rdf.clownface({ dataset: await req.dataset() })
  const pageSize = Number(query.out(hydra.limit).value || 10)
  const page = Number(query.out(hydra.pageIndex).value || 1)
  const offset = (page - 1) * pageSize

  const queryParams = {
    freetextQuery: query.has(hydra.freetextQuery).out(hydra.freetextQuery).value,
    limit: pageSize,
    offset,
  }
  const collection = getCollection({
    memberQuads: await getHierarchies(queryParams).execute(parsingClient),
    collectionType: md.Hierarchies,
    memberType: md.Hierarchy,
    collection: req.hydra.resource.term,
  })

  return res.dataset(collection.dataset)
})

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await create({
    resource: rewrite(await req.resource()),
    store: store(),
  })

  res.setHeader('Location', pointer.value)
  res.status(201)
  return res.dataset(pointer.dataset)
}))
