import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../../middleware/shacl'
import { updateTable } from '../../domain/table/update'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const table = await updateTable({
      resource: await req.resource(),
    })

    return res.dataset(table.dataset)
  }),
)
