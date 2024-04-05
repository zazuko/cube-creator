import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import { createCsvw } from '../../domain/table/csvw.js'

export const get = protectedResource(asyncMiddleware(async (req, res) => {
  const csvwTable = await createCsvw({
    tableResource: req.hydra.resource.term,
    resources: req.resourceStore(),
  })

  return res.dataset(csvwTable.pointer.dataset)
}))
