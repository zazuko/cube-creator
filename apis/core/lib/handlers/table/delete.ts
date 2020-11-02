import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { deleteTable } from '../../domain/table/delete'

export const remove = protectedResource(
  asyncMiddleware(async (req, res) => {
    const project = req.hydra.resource.term
    await deleteTable({ resource: project })
    res.sendStatus(204)
  }),
)
