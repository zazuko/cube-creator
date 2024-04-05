import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { oa } from '@tpluscode/rdf-ns-builders'
import { updateTerm } from '../domain/shared-dimension-term.js'
import { store } from '../store/index.js'
import { shaclValidate } from '../middleware/shacl.js'
import { rewrite } from '../rewrite.js'

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
