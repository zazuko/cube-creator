import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { createProject } from '../domain/cube-projects/create'
import { updateProject } from '../domain/cube-projects/update'
import { deleteProject } from '../domain/cube-projects/delete'
import * as triggers from '../pipeline/trigger'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import env from '@cube-creator/core/env'

const trigger = (triggers as Record<string, (job: GraphPointer<NamedNode>, params?: GraphPointer) => void>)[env.PIPELINE_TYPE]

export const post = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const user = req.user?.id
    const userName = req.user?.name

    if (!user || !userName) {
      throw new Error('User is not defined')
    }

    const { project: { pointer: project }, job } = await createProject({
      projectsCollection: await req.hydra.resource.clownface(),
      resource: await req.resource(),
      user,
      userName,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    if (job) {
      trigger(job)
    }

    res.status(201)
    res.header('Location', project.value)
    await res.dataset(project.dataset)
  }),
)

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const project = await req.hydra.resource.clownface()
    await updateProject({
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(200)
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
