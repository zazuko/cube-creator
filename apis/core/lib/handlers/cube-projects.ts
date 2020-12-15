import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { createProject } from '../domain/cube-projects/create'
import { updateProject } from '../domain/cube-projects/update'
import { deleteProject } from '../domain/cube-projects/delete'

export const post = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const user = req.user?.id

    if (!user) {
      throw new Error('User is not defined')
    }

    const { pointer: project } = await createProject({
      projectsCollection: clownface(req.hydra.resource),
      resource: await req.resource(),
      user,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(201)
    res.header('Location', project.value)
    await res.dataset(project.dataset)
  }),
)

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const project = clownface(req.hydra.resource)
    await updateProject({
      resource: await req.resource(),
      project: project,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(201)
    res.header('Location', project.value)
    await res.dataset(project.dataset)
  }),
)

export const remove = protectedResource(
  asyncMiddleware(async (req, res) => {
    const project = req.hydra.resource.term
    await deleteProject({
      resource: project,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.sendStatus(204)
  }),
)
