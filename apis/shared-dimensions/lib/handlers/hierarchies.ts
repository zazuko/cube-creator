import { asyncMiddleware } from 'middleware-async'
import { md, meta } from '@cube-creator/core/namespace'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { parsingClient } from '../sparql'
import { getHierarchies, create } from '../domain/hierarchies'
import { shaclValidate } from '../middleware/shacl'
import { rewrite } from '../rewrite'
import { store } from '../store'
import { getCollection } from './collection'

export const get = asyncMiddleware(async (req, res) => {
  const collection = await getCollection({
    memberQuads: await getHierarchies().execute(parsingClient.query),
    collectionType: md.Hierarchies,
    memberType: meta.Hierarchy,
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
