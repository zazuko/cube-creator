import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../../middleware/shacl'
import { createTable } from '../../domain/table/create'
import clownface from 'clownface'

export const post = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const table = await createTable({
      tableCollection: clownface(req.hydra.resource),
      resource: await req.resource(),
    })

    res.status(201)
    res.header('Location', table.value)
    await res.dataset(table.dataset)
  }),
)
