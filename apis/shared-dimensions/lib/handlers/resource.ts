import asyncMiddleware from 'middleware-async'
import { NO_CONTENT } from 'http-status'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { store } from '../store'
import { cascadeDelete } from '../domain/resource'
import { shaclValidate } from '../middleware/shacl'
import { rewrite } from '../rewrite'

export const DELETE = protectedResource(asyncMiddleware(async (req, res) => {
  await cascadeDelete({
    store: store(),
    term: req.hydra.resource.term,
    api: clownface(req.hydra.api),
  })

  res.sendStatus(NO_CONTENT)
}))

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const resource = rewrite(await req.resource())
  await store().save(resource)

  return res.dataset(resource.dataset)
}))
