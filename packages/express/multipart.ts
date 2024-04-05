import { Readable } from 'stream'
import type { NamedNode, Stream } from '@rdfjs/types'
import E, { Router } from 'express'
import formats from '@rdfjs-elements/formats-pretty'
import once from 'once'
import { BadRequest } from 'http-errors'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import asyncMiddleware from 'middleware-async'
import mime from 'mime-types'
import multer from 'multer'

export function isMultipart(req: E.Request) {
  return req.get('content-type')?.includes('multipart/form-data')
}

export type Files = Record<string, (baseIri: string) => Stream & Readable>

declare module 'express-serve-static-core' {
  interface Request {
    parseFromMultipart(): Promise<GraphPointer<NamedNode>>
    multipartFileQuadsStreams(): Files
  }
}

// eslint-disable-next-line no-undef
function parseFile(file: Express.Multer.File, baseIRI: string): Stream & Readable {
  const mimeType = mime.lookup(file.originalname)

  let parserStream = formats.parsers.import(file.mimetype, Readable.from(file.buffer), {
    baseIRI,
  })

  if (!parserStream && mimeType) {
    parserStream = formats.parsers.import(mimeType, Readable.from(file.buffer), {
      baseIRI,
    })
  }

  if (!parserStream) {
    throw new BadRequest(`Parser not found for file ${file.originalname}`)
  }

  return parserStream as any
}

export const multiPartResourceHandler: E.Router = Router()

multiPartResourceHandler.use(multer().any())
multiPartResourceHandler.use(asyncMiddleware((req, res, next) => {
  req.parseFromMultipart = once(async () => {
    const { files } = req

    if (!(files && Array.isArray(files))) {
      throw new BadRequest('Unexpected multipart body')
    }
    const representation = files.find(file => file.fieldname === 'representation')
    if (!representation) {
      throw new BadRequest('Missing request part "representation"')
    }

    return $rdf.clownface({
      dataset: await $rdf.dataset().import(parseFile(representation, req.hydra.term.value)),
      term: req.hydra.term,
    })
  })

  req.multipartFileQuadsStreams = () => {
    if (Array.isArray(req.files)) {
      return req.files.reduce((files, file) => {
        return {
          ...files,
          [file.fieldname]: (baseIri: string) => parseFile(file, baseIri),
        }
      }, {})
    }

    return {}
  }

  next()
}))
