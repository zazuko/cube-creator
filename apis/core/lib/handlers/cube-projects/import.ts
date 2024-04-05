import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { multiPartResourceHandler } from '@cube-creator/express/multipart'
import asyncMiddleware from 'middleware-async'
import { INSERT } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env'
import formats from '@rdfjs-elements/formats-pretty'
import toStream from 'string-to-stream'
import { shaclValidate } from '../../middleware/shacl.js'
import { importProject } from '../../domain/cube-projects/import.js'
import { streamClient } from '../../query-client.js'
import { DatasetShape } from '../../../bootstrap/shapes/dataset.js'
import { ColumnMappingShape } from '../../../bootstrap/shapes/column-mapping.js'

export const postImportedProject = protectedResource(
  multiPartResourceHandler,
  shaclValidate.override({
    parseResource: req => req.parseFromMultipart(),
  }),
  asyncMiddleware(async function prepareImport(req, res, next) {
    const user = req.user?.id

    if (!user) {
      throw new Error('User is not defined')
    }

    const { project, importedDataset } = await importProject({
      projectsCollection: await req.hydra.resource.clownface(),
      resource: await req.parseFromMultipart(),
      files: req.multipartFileQuadsStreams(),
      store: req.resourceStore(),
      user,
    })
    res.locals.project = project
    res.locals.importedDataset = importedDataset
    next()
  }),
  shaclValidate.override({
    disableShClass: true,
    async parseResource(req, res) {
      const { project, importedDataset } = res.locals
      return $rdf.clownface({ dataset: importedDataset }).node(project.id)
    },
    async loadShapes() {
      const shapes = [
        DatasetShape,
        ColumnMappingShape,
      ].map(ttlStr => ttlStr.toString()).join('\n')

      return $rdf.dataset().import(formats.parsers.import('text/turtle', toStream(shapes))!)
    },
  }),
  asyncMiddleware(async (req, res) => {
    const { project, importedDataset } = res.locals

    await req.resourceStore().save()
    await INSERT.DATA`${importedDataset}`.execute(streamClient)

    res.status(201)
    res.header('Location', project.pointer.value)
    await res.dataset(project.pointer.dataset)
  }))
