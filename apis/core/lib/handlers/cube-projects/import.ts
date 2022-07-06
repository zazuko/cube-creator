import path from 'path'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { multiPartResourceHandler } from '@cube-creator/express/multipart'
import asyncMiddleware from 'middleware-async'
import { INSERT } from '@tpluscode/sparql-builder'
import clownface from 'clownface'
import fromFile from 'rdf-utils-fs/fromFile'
import $rdf from 'rdf-ext'
import { shaclValidate } from '../../middleware/shacl'
import { importProject } from '../../domain/cube-projects/import'
import { streamClient } from '../../query-client'

export const postImportedProject = protectedResource(
  multiPartResourceHandler,
  shaclValidate.override({
    parseResource: req => req.parseFromMultipart(),
  }),
  asyncMiddleware(async function prepareImport(req, res, next) {
    const user = req.user?.id
    const userName = req.user?.name

    if (!user || !userName) {
      throw new Error('User is not defined')
    }

    const { project, importedDataset } = await importProject({
      projectsCollection: await req.hydra.resource.clownface(),
      resource: await req.parseFromMultipart(),
      files: req.multipartFileQuadsStreams(),
      store: req.resourceStore(),
      user,
      userName,
    })
    res.locals.project = project
    res.locals.importedDataset = importedDataset
    next()
  }),
  shaclValidate.override({
    async parseResource(req, res) {
      const { project, importedDataset } = res.locals
      return clownface({ dataset: importedDataset }).node(project.id)
    },
    async loadShapes() {
      return $rdf.dataset().import(fromFile(path.resolve(__dirname, '../../domain/cube-projects/import.ttl')))
    },
  }),
  asyncMiddleware(async (req, res) => {
    const { project, importedDataset } = res.locals

    await req.resourceStore().save()
    await INSERT.DATA`${importedDataset}`.execute(streamClient.query)

    res.status(201)
    res.header('Location', project.pointer.value)
    await res.dataset(project.pointer.dataset)
  }))
