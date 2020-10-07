import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { shaclValidate } from '../middleware/shacl'
import { uploadFile } from '../domain/csv-source/upload'

export const post = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const fileLocation = await uploadFile({
      file: req.body,
      fileName: req.params.fileName,
      resource: await req.resource(),
      store: req.app.resources(),
    })

    res.status(201)
    res.header('Location', fileLocation.value)
    await res.dataset(fileLocation.dataset)
  }),
)
