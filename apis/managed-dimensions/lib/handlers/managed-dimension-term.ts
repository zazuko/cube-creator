import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { updateTerm } from '../domain/managed-dimension-term'
import { store } from '../store'
import { shaclValidate } from '../middleware/shacl'

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await updateTerm({
    store: store(),
    term: await req.resource(),
  })

  return res.dataset(pointer.dataset)
}))
