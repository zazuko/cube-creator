import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { oa } from '@tpluscode/rdf-ns-builders'
import { updateTerm } from '../domain/shared-dimension-term'
import { store } from '../store'
import { shaclValidate } from '../middleware/shacl'
import { rewrite } from '../rewrite'

export const get = protectedResource(asyncMiddleware(async (req, res) => {
  const term = rewrite(await req.resource())
  const pointer = await store().load(term.term)

  pointer.addOut(oa.canonical, pointer)

  return res.dataset(pointer.dataset)
}))

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await updateTerm({
    store: store(),
    term: rewrite(await req.resource()),
  })

  pointer.addOut(oa.canonical, pointer)

  return res.dataset(pointer.dataset)
}))
