import { protectedResource } from '@hydrofoil/labyrinth/resource'
import multer from 'multer'
import { multiPartResourceHandler } from '@cube-creator/express/multipart'
import asyncMiddleware from 'middleware-async'
import { INSERT } from '@tpluscode/sparql-builder'
import { shaclValidate } from '../../middleware/shacl'
import { importProject } from '../../domain/cube-projects/import'
import { streamClient } from '../../query-client'

export const postImportedProject = protectedResource(
  multer().any(),
  multiPartResourceHandler,
  shaclValidate.override({
    parseResource: req => req.parseFromMultipart(),
  }),
  asyncMiddleware(async (req, res) => {
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
    await req.resourceStore().save()
    await INSERT.DATA`${importedDataset}`.execute(streamClient.query)

    res.status(201)
    res.header('Location', project.pointer.value)
    await res.dataset(project.pointer.dataset)
  }))
