import * as express from 'express'
import asyncMiddleware from 'middleware-async'
import * as labyrinth from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { cc } from '@cube-creator/core/namespace'
import type { AnyPointer, GraphPointer } from 'clownface'
import { schema } from '@tpluscode/rdf-ns-builders'
import { ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { shaclValidate } from '../middleware/shacl.js'
import { createCSVSource } from '../domain/csv-source/upload.js'
import { deleteSource } from '../domain/csv-source/delete.js'
import { update } from '../domain/csv-source/update.js'
import { replaceFile } from '../domain/csv-source/replace.js'
import { getMediaStorage } from '../storage/index.js'

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

function isGraphPointer(ptr: AnyPointer): ptr is GraphPointer<ResourceIdentifier> {
  return ptr.term?.termType === 'NamedNode' || ptr.term?.termType === 'BlankNode'
}

function getPresignedLink(csvSource: GraphPointer): string {
  const mediaPointer = csvSource.out(schema.associatedMedia)
  if (isGraphPointer(mediaPointer)) {
    const media = mediaObjectFromPointer(mediaPointer)
    const storage = getMediaStorage(media)

    return storage.getDownloadLink(media)
  }

  return ''
}

function setPresignedLink(csvSource: GraphPointer): void {
  const s3DirectDownload = getPresignedLink(csvSource)

  if (s3DirectDownload) {
    csvSource
      .out(schema.associatedMedia)
      .deleteOut(schema.contentUrl)
      .addOut(schema.contentUrl, csvSource.namedNode(s3DirectDownload))
  }
}
