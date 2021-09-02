import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { serializers } from '@rdfjs-elements/formats-pretty'
import { shaclValidate } from '../middleware/shacl'
import { createProject } from '../domain/cube-projects/create'
import { updateProject } from '../domain/cube-projects/update'
import { deleteProject } from '../domain/cube-projects/delete'
import { getExportedProject } from '../domain/cube-projects/export'
import * as triggers from '../pipeline/trigger'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import env from '@cube-creator/core/env'
import { cc, cube, meta } from '@cube-creator/core/namespace'
import * as ns from '@tpluscode/rdf-ns-builders'
import cors from 'cors'

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

  const quadStream: any = serializers.import('application/trig', data, {
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
