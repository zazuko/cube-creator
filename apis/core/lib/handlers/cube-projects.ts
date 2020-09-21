import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { createProject } from '../domain/cube-projects/create'

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const project = await createProject({
    resource: await req.resource(),
    store: req.app.resources(),
  })

  res.status(201)
  res.header('Location', project.value)
  await res.dataset(project.dataset)
}))
