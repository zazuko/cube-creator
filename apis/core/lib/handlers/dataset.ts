
import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dataset/update'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const dataset = await update({
      dataset: clownface(req.hydra.resource),
      resource: await req.resource(),
    })

    res.status(201)
    res.header('Location', dataset.term.value)
    await res.dataset(dataset.dataset)
  }),
)
