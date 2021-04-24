import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import clownface from 'clownface'
import { hydra } from '@tpluscode/rdf-ns-builders'
import { createTerm, update } from '../domain/shared-dimension'
import { store } from '../store'
import { shaclValidate } from '../middleware/shacl'
import { rewrite } from '../rewrite'

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const term = await createTerm({
    resource: rewrite(await req.resource()),
    termSet: clownface({ dataset: await req.hydra.resource.dataset() }).node(req.hydra.term),
    store: store(),
  })

  res.setHeader('Location', term.value)
  res.status(201)
  return res.dataset(term.dataset)
}))

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const dimension = await update({
    resource: rewrite(await req.resource()),
    store: store(),
    shape: req.hydra.operation.out(hydra.expects),
  })

  return res.dataset(dimension.dataset)
}))
