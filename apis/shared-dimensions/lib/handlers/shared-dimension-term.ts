import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { updateTerm } from '../domain/shared-dimension-term'
import { store } from '../store'
import { shaclValidate } from '../middleware/shacl'
import { rewrite } from '../rewrite'

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await updateTerm({
    store: store(),
    term: rewrite(await req.resource()),
  })

  return res.dataset(pointer.dataset)
}))
