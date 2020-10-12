import asyncMiddleware from 'middleware-async'
import * as labyrinth from '@hydrofoil/labyrinth/resource'
import { parse } from 'content-disposition'
import clownface from 'clownface'
import { is } from 'type-is'
import { shaclValidate } from '../middleware/shacl'
import { uploadFile } from '../domain/csv-source/upload'
import { cc } from '@cube-creator/core/namespace'
import { getCSVHead } from '../domain/csv-source/get-head'

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
      file: req.read(),
      fileName: fileName,
      resource: csvMapping,
      store: req.app.resources(),
    })
    res.status(201)
    res.header('Location', fileLocation.value)
    await res.dataset(fileLocation.dataset)
  }),
)

const getCSVSource = labyrinth.protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res, next) => {
    if ((!req.headers['content-type'] || !is(req.headers['content-type'], 'text/csv'))) {
      next()
      return
    }

    const csvSource = req.hydra.resource.term

    const head = await getCSVHead({
      resource: csvSource,
      store: req.app.resources(),
    })

    res.type('text/csv')
    res.send(head)
  }),
)

export const get = labyrinth.protectedResource(getCSVSource, labyrinth.get)
