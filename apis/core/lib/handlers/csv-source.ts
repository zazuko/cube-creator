import * as express from 'express'
import asyncMiddleware from 'middleware-async'
import * as labyrinth from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { shaclValidate } from '../middleware/shacl'
import { createCSVSource } from '../domain/csv-source/upload'
import { cc } from '@cube-creator/core/namespace'
import { deleteSource } from '../domain/csv-source/delete'
import { update } from '../domain/csv-source/update'
import { replaceFile } from '../domain/csv-source/replace'
import { mediaObjectFromPointer } from '../../../../packages/model/CsvSource'
import { getMediaStorage } from '../storage'
import { GraphPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import { NamedNode } from 'rdf-js'
import * as s3 from '../storage/s3'

export const post = labyrinth.protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const csvMapping = (await req.hydra.resource.clownface()).out(cc.csvMapping).term

    if (!csvMapping) {
      throw new Error('Multiple csv mapping found')
    }

    if (csvMapping.termType !== 'NamedNode') {
      throw new Error('Csv mapping was not a named node')
    }

    const fileLocation = await createCSVSource({
      csvMappingId: csvMapping,
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    setPresignedLink(fileLocation)

    res.status(201)
    res.header('Location', fileLocation.value)
    await res.dataset(fileLocation.dataset)
  }),
)

export const put = labyrinth.protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const csvSource = await update({
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    setPresignedLink(csvSource)

    return res.dataset(csvSource.dataset)
  }),
)

export const presignUrl: Enrichment = async (req, csvSource) => {
  setPresignedLink(csvSource)
}

const getCSVSource: express.RequestHandler = asyncMiddleware(async (req, res, next) => {
  if (!req.accepts('text/csv')) {
    return next()
  }

  const csvSource = await req.hydra.resource.clownface()
  const directDownload = getPresignedLink(csvSource)
  if (!directDownload) {
    return next(new Error('s3 key not found'))
  }

  res.header('Location', directDownload)
  res.sendStatus(305)
})

export const get = labyrinth.protectedResource(getCSVSource, labyrinth.get)

export const remove = labyrinth.protectedResource(
  asyncMiddleware(async (req, res) => {
    const csvSource = req.hydra.resource.term
    await deleteSource({
      resource: csvSource,
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.sendStatus(204)
  }),
)

export const replace = labyrinth.protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const csvSource = await replaceFile({
      csvSourceId: req.hydra.resource.term,
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    setPresignedLink(csvSource)

    await res.dataset(csvSource.dataset)
  }),
)

function getPresignedLink(csvSource: GraphPointer, fileStorage: s3.FileStorage = s3): string {
  const mediaPointer = csvSource.out(schema.associatedMedia) as GraphPointer<NamedNode>
  const media = mediaObjectFromPointer(mediaPointer)
  const storage = getMediaStorage(media, fileStorage)

  return storage.getDownloadLink(media)
}

function setPresignedLink(csvSource: GraphPointer, fileStorage: s3.FileStorage = s3): void {
  const s3DirectDownload = getPresignedLink(csvSource, fileStorage)

  if (s3DirectDownload) {
    csvSource
      .out(schema.associatedMedia)
      .deleteOut(schema.contentUrl)
      .addOut(schema.contentUrl, csvSource.namedNode(s3DirectDownload))
  }
}
