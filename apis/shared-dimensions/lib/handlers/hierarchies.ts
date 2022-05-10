import { asyncMiddleware } from 'middleware-async'
import { md } from '@cube-creator/core/namespace'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { hydra } from '@tpluscode/rdf-ns-builders'
import clownface from 'clownface'
import httpError from 'http-errors'
import { parsingClient } from '../sparql'
import { getHierarchies, create } from '../domain/hierarchies'
import { shaclValidate } from '../middleware/shacl'
import { rewrite } from '../rewrite'
import { store } from '../store'
import { getCollection } from './collection'

export const get = asyncMiddleware(async (req, res, next) => {
  if (!req.dataset) {
    return next(new httpError.BadRequest())
  }

  const query = clownface({ dataset: await req.dataset() })
  const pageSize = Number(query.out(hydra.limit).value || 10)
  const page = Number(query.out(hydra.pageIndex).value || 1)
  const offset = (page - 1) * pageSize

  const queryParams = {
    freetextQuery: query.has(hydra.freetextQuery).out(hydra.freetextQuery).value,
    limit: pageSize,
    offset,
  }
  const collection = await getCollection({
    memberQuads: await getHierarchies(queryParams).execute(parsingClient.query),
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
