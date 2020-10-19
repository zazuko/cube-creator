import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { createCSVMapping } from '../domain/csv-mapping/create'

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const project = await createCSVMapping({
    resource: await req.resource(),
  })

  res.status(201)
  res.header('Location', project.value)
  await res.dataset(project.dataset)
}))
