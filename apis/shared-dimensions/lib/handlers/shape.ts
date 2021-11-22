import asyncMiddleware from 'middleware-async'
import { NotFoundError } from '@cube-creator/api-errors'
import shapes from '../shapes'

export const get = asyncMiddleware(async (req, res, next) => {
  const load = shapes.get(req.hydra.resource.term)
  if (!load) {
    return next(new NotFoundError(req.hydra.resource.term))
  }

  const shape = await load(req)
  await res.dataset(shape.dataset)
})
