import asyncMiddleware from 'middleware-async'
import { store } from '../store'

export const get = asyncMiddleware(async (req, res) => {
  const resource = await store().load(req.hydra.resource.term)

  return res.dataset(resource.dataset)
})
