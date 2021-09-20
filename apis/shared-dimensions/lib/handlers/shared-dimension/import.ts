import { protectedResource } from '@hydrofoil/labyrinth/resource'
import multer from 'multer'
import asyncMiddleware from 'middleware-async'
import { multiPartResourceHandler } from '@cube-creator/express/multipart'
import { shaclValidate } from '../../middleware/shacl'
import { streamClient } from '../../sparql'
import { importDimension } from '../../domain/shared-dimension'
import { store } from '../../store'

export const postImportedDimension = protectedResource(
  multer().any(),
  multiPartResourceHandler,
  shaclValidate.override({
    parseResource: req => req.parseFromMultipart(),
  }),
  asyncMiddleware(async (req, res) => {
    const { termSet } = await importDimension({
      resource: await req.parseFromMultipart(),
      files: req.multipartFileQuadsStreams(),
      store: store(),
      client: streamClient,
    })

    res.status(201)
    res.setHeader('Location', termSet.value)
    return res.dataset(termSet.dataset)
  }),
)
