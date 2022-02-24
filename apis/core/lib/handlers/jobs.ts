import { NamedNode } from 'rdf-js'
import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { GraphPointer } from 'clownface'
import env from '@cube-creator/core/env'
import express from 'express'
import { shaclValidate } from '../middleware/shacl'
import { createPublishJob, createUnlistJob, createTransformJob, createImportJob } from '../domain/job/create'
import * as triggers from '../pipeline/trigger'
import { update } from '../domain/job/update'
import { ResourceStore } from '../ResourceStore'

const trigger = (triggers as Record<string, (job: GraphPointer<NamedNode>, params: GraphPointer) => void>)[env.PIPELINE_TYPE]

interface CreateJob {
  (params: { resource: NamedNode; store: ResourceStore }): Promise<GraphPointer<NamedNode>>
}

function createJobHandler(createJob: CreateJob): express.RequestHandler {
  return asyncMiddleware(async (req, res) => {
    if (!trigger) {
      throw new Error(`Trigger ${env.PIPELINE_TYPE} is not implemented`)
    }

    const job = await createJob({
      resource: req.hydra.resource.term,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    await trigger(job, await req.resource())

    res.status(201)
    res.header('Location', job.value)
    await res.dataset(job.dataset)
  })
}

export const transform = protectedResource(
  shaclValidate,
  createJobHandler(createTransformJob),
)

export const publish = protectedResource(
  shaclValidate,
  createJobHandler(createPublishJob),
)

export const unlist = protectedResource(
  shaclValidate,
  createJobHandler(createUnlistJob),
)

export const startImport = protectedResource(
  shaclValidate,
  createJobHandler(createImportJob),
)

export const patch = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const { dataset } = await update({
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    return res.dataset(dataset)
  }),
)
