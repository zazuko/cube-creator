import asyncMiddleware from 'middleware-async'
import * as labyrinth from '@hydrofoil/labyrinth/resource'
import { parse } from 'content-disposition'
import clownface from 'clownface'
import { shaclValidate } from '../middleware/shacl'
import { uploadFile } from '../domain/csv-source/upload'
import { cc } from '@cube-creator/core/namespace'
import { getCSVHead } from '../domain/csv-source/get-head'
import { deleteSource } from '../domain/csv-source/delete'
import { update } from '../domain/csv-mapping/update'

export const post = labyrinth.protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const csvMapping = clownface(req.hydra.resource).out(cc.csvMapping).term

    if (!csvMapping) {
      throw new Error('Multiple csv mapping found')
    }

    if (csvMapping.termType !== 'NamedNode') {
      throw new Error('Csv mapping was not a named node')
    }

    const contentDisposition = req.headers['content-disposition']
    const fileName = contentDisposition
      ? parse(contentDisposition).parameters.filename
      : new Date().toISOString()

    const fileLocation = await uploadFile({
      file: req,
      fileName: fileName,
      resource: csvMapping,
    })
    res.status(201)
    res.header('Location', fileLocation.value)
    await res.dataset(fileLocation.dataset)
  }),
)

export const put = labyrinth.protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const { dataset } = await update({
      resource: await req.resource(),
    })

    return res.dataset(dataset)
  }),
)

const getCSVSource = asyncMiddleware(async (req, res, next) => {
  if (!req.accepts('text/csv')) {
    return next()
  }

  const csvSource = req.hydra.resource.term

  const head = await getCSVHead({
    resource: csvSource,
  })

  res.type('text/csv')
  res.send(head)
})

export const get = labyrinth.protectedResource(getCSVSource, labyrinth.get)

export const remove = labyrinth.protectedResource(
  asyncMiddleware(async (req, res) => {
    const csvSource = req.hydra.resource.term
    await deleteSource({
      resource: csvSource,
    })
    res.sendStatus(204)
  }),
)
