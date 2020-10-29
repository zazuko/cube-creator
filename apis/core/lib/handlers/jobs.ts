import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { startTransformation } from '../domain/job/start-transformation'

export const transform = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const job = await startTransformation({
      resource: req.hydra.resource.term,
    })

    res.status(201)
    res.header('Location', job.value)
    await res.dataset(job.dataset)
  }),
)
