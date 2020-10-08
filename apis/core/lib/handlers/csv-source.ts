import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { uploadFile } from '../domain/csv-source/upload'
import clownface from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { parse } from 'content-disposition'

export const post = protectedResource(
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
    const fileName = contentDisposition ? parse(contentDisposition).parameters.filename : new Date().toISOString()

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
