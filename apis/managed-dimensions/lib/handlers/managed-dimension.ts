import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import { createTerm } from '../domain/managed-dimension'
import { store } from '../store'

export const post = asyncMiddleware(async (req, res) => {
  const term = await createTerm({
    resource: await req.resource(),
    termSet: clownface({ dataset: await req.hydra.resource.dataset() }).node(req.hydra.term),
    store: store(),
  })

  res.setHeader('Location', term.value)
  res.status(201)
  return res.dataset(term.dataset)
})
