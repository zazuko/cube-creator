import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { create } from '../domain/job/create'
import { triggerPipeline } from '../pipeline/trigger'

export const transform = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const job = await create({
      resource: req.hydra.resource.term,
    })

    await triggerPipeline(job.term)

    res.status(201)
    res.header('Location', job.value)
    await res.dataset(job.dataset)
  }),
)
