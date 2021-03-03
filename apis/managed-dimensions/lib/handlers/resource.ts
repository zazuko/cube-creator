import asyncMiddleware from 'middleware-async'
import { NO_CONTENT } from 'http-status'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { store } from '../store'
import { cascadeDelete } from '../domain/resource'

export const DELETE = protectedResource(asyncMiddleware(async (req, res) => {
  await cascadeDelete({
    store: store(),
    term: req.hydra.resource.term,
    api: clownface(req.hydra.api),
  })

  res.sendStatus(NO_CONTENT)
}))
