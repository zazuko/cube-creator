import asyncMiddleware from 'middleware-async'
import conditional from 'express-conditional-middleware'
import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import formats from '@rdfjs-elements/formats-pretty'
import env from '@cube-creator/core/env/node'
import { cc, cube, meta } from '@cube-creator/core/namespace'
import * as ns from '@tpluscode/rdf-ns-builders'
import cors from 'cors'
import { isMultipart } from '@cube-creator/express/multipart'
import type { DatasetCore, NamedNode } from '@rdfjs/types'
import clownface from 'clownface'
import { shaclValidate } from '../middleware/shacl.js'
import { createProject } from '../domain/cube-projects/create.js'
import { updateProject } from '../domain/cube-projects/update.js'
import { deleteProject } from '../domain/cube-projects/delete.js'
import { getExportedProject } from '../domain/cube-projects/export.js'
import { getProjectDetails } from '../domain/cube-projects/details.js'
import { triggers } from '../pipeline/trigger.js'
import { parsingClient, streamClient } from '../query-client.js'
import { postImportedProject } from './cube-projects/import.js'

const trigger = triggers[env.PIPELINE_TYPE]

const postDirect = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const user = req.user?.id

    if (!user) {
      throw new Error('User is not defined')
    }

    const pointer: { term: NamedNode; dataset: DatasetCore } = await req.hydra.resource.clownface()
    const { project: { pointer: project }, job } = await createProject({
      projectsCollection: clownface(pointer),
      resource: await req.resource(),
      user,
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

export const post = conditional(isMultipart, postImportedProject, postDirect)

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const project = await updateProject({
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(200)
    await res.dataset(project.pointer.dataset)
  }),
)

export const remove = protectedResource(
  asyncMiddleware(async (req, res) => {
    const project = req.hydra.resource.term
    await deleteProject({
      resource: project,
      store: req.resourceStore(),
      client: parsingClient,
    })
    await req.resourceStore().save()

    res.sendStatus(204)
  }),
)

export const getExport = protectedResource(cors({ exposedHeaders: 'content-disposition' }), asyncMiddleware(async (req, res) => {
  const { project, data } = await getExportedProject({
    resource: req.hydra.resource.term,
    store: req.resourceStore(),
  })

  res.setHeader('Content-Disposition', `attachment; filename="${project.label}.trig"`)
  res.setHeader('Content-Type', 'application/trig')

  const quadStream: any = formats.serializers.import('application/trig', data, {
    prefixes: {
      cc: cc().value,
      rdf: ns.rdf().value,
      rdfs: ns.rdfs().value,
      xsd: ns.xsd().value,
      schema: ns.schema().value,
      dcterms: ns.dcterms().value,
      vcard: ns.vcard().value,
      dcat: ns.dcat().value,
      hydra: ns.hydra().value,
      dtype: ns.dtype().value,
      csvw: ns.csvw().value,
      qudt: ns.qudt().value,
      time: ns.time().value,
      unit: ns.unit().value,
      prov: ns.prov().value,
      void: ns._void().value,
      cube: cube().value,
      meta: meta().value,
    },
  })
  quadStream.pipe(res)
}))

export const getDetails = protectedResource(asyncMiddleware(async (req, res) => {
  const quadStream = await getProjectDetails({
    project: req.hydra.resource.term,
    resource: req.hydra.term,
  }).execute(streamClient)

  return res.quadStream(quadStream)
}))
