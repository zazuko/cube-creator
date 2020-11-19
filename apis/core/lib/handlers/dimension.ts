import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension/update'

export const get = protectedResource(asyncMiddleware((req, res) => {
  return res.dataset(req.hydra.resource.dataset)
}))

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const updated = await update({
      metadataCollection: req.hydra.resource.term,
      dimensionMetadata: await req.resource(),
    })

    return res.dataset(updated.dataset)
  }),
)
