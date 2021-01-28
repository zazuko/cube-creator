import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension-mapping/update'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const dimensionMapping = await update({
      resource: req.hydra.resource.term,
      mappings: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    return res.dataset(dimensionMapping.dataset)
  }))
