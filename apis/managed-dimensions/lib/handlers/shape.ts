import asyncMiddleware from 'middleware-async'
import { NotFoundError } from '@cube-creator/api-errors'
import shapes from '../shapes'

export const get = asyncMiddleware(async (req, res, next) => {
  const shape = shapes.get(req.hydra.resource.term)
  if (!shape) {
    return next(new NotFoundError(req.hydra.resource.term))
  }

  await res.dataset(shape().dataset)
})
