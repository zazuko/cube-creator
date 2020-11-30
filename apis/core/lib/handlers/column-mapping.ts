import asyncMiddleware from 'middleware-async'
import * as labyrinth from '@hydrofoil/labyrinth/resource'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { createColumnMapping } from '../domain/column-mapping/create'
import { updateColumnMapping } from '../domain/column-mapping/update'
import { deleteColumnMapping } from '../domain/column-mapping/delete'

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const columnMapping = await createColumnMapping({
    tableId: req.hydra.resource.term,
    resource: await req.resource(),
  })

  res.status(201)
  res.header('Location', columnMapping.value)
  await res.dataset(columnMapping.dataset)
}))

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const columnMapping = await updateColumnMapping({
    resource: await req.resource(),
  })

  await res.dataset(columnMapping.dataset)
}))

export const remove = labyrinth.protectedResource(
  asyncMiddleware(async (req, res) => {
    const columnMapping = req.hydra.resource
    await deleteColumnMapping({ resource: columnMapping.term })
    res.sendStatus(204)
  }),
)
