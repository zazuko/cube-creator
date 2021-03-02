import asyncMiddleware from 'middleware-async'
import { NO_CONTENT } from 'http-status'
import clownface from 'clownface'
import { store } from '../store'
import { cascadeDelete } from '../domain/resource'

export const DELETE = asyncMiddleware(async (req, res) => {
  await cascadeDelete({
    store: store(),
    term: req.hydra.resource.term,
    api: clownface(req.hydra.api),
  })

  res.status(NO_CONTENT)
})
