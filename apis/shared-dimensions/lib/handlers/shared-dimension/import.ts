import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import { multiPartResourceHandler } from '@cube-creator/express/multipart'
import { validationReportResponse } from 'hydra-box-middleware-shacl'
import { shaclValidate } from '../../middleware/shacl.js'
import { streamClient } from '../../sparql.js'
import { importDimension } from '../../domain/shared-dimension/index.js'
import { store } from '../../store/index.js'

export const postImportedDimension = protectedResource(
  multiPartResourceHandler,
  shaclValidate.override({
    parseResource: req => req.parseFromMultipart(),
  }),
  asyncMiddleware(async (req, res) => {
    const result = await importDimension({
      resource: await req.parseFromMultipart(),
      files: req.multipartFileQuadsStreams(),
      store: store(),
      client: streamClient,
    })

    if ('conforms' in result) {
      return validationReportResponse(res, result, {
        title: 'Imported dimension is invalid',
      })
    }

    res.status(201)
    res.setHeader('Location', result.termSet.value)
    return res.dataset(result.termSet.dataset)
  }),
)
