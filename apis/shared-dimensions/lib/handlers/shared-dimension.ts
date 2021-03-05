import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import clownface from 'clownface'
import { createTerm } from '../domain/shared-dimension'
import { store } from '../store'
import { shaclValidate } from '../middleware/shacl'

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const term = await createTerm({
    resource: await req.resource(),
    termSet: clownface({ dataset: await req.hydra.resource.dataset() }).node(req.hydra.term),
    store: store(),
  })

  res.setHeader('Location', term.value)
  res.status(201)
  return res.dataset(term.dataset)
}))
