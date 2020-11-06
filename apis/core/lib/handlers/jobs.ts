import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { createJob } from '../domain/job/create'
import * as triggers from '../pipeline/trigger'
import env from '@cube-creator/core/env'
import { NamedNode } from 'rdf-js'
import { update } from '../domain/job/update'

const trigger = (triggers as Record<string, (job: NamedNode) => void>)[env.PIPELINE_TYPE]

export const transform = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    if (!trigger) {
      throw new Error(`Trigger ${env.PIPELINE_TYPE} is not implemented`)
    }

    const job = await createJob({
      resource: req.hydra.resource.term,
    })

    await trigger(job.term)

    res.status(201)
    res.header('Location', job.value)
    await res.dataset(job.dataset)
  }),
)

export const patch = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const { dataset } = await update({
      resource: await req.resource(),
    })

    return res.dataset(dataset)
  }),
)
