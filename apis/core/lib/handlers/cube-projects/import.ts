import { protectedResource } from '@hydrofoil/labyrinth/resource'
import multer from 'multer'
import { parsers } from '@rdfjs-elements/formats-pretty'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import E from 'express'
import once from 'once'
import { NamedNode } from 'rdf-js'
import { BadRequest } from 'http-errors'
import asyncMiddleware from 'middleware-async'
import { Readable } from 'stream'
import { shaclValidate } from '../../middleware/shacl'

declare module 'express-serve-static-core' {
  interface Request {
    parseFromMultipart(): Promise<GraphPointer<NamedNode>>
  }
}

const multiPartResourceHandler: E.RequestHandler = asyncMiddleware((req, res, next) => {
  req.parseFromMultipart = once(async () => {
    const { files } = req

    if (!(files && Array.isArray(files))) {
      throw new BadRequest('Unexpected multipart body')
    }
    const representation = files.find(file => file.fieldname === 'representation')
    if (!representation) {
      throw new Error('Missing request part "representation"')
    }

    const parserStream = parsers.import(representation.mimetype, Readable.from(representation.buffer), {
      baseIRI: req.hydra.term.value,
    })
    if (!parserStream) {
      throw new BadRequest('Parser not found')
    }

    return clownface({
      dataset: await $rdf.dataset().import(parserStream),
      term: req.hydra.term,
    })
  })

  next()
})

export const postImportedProject = protectedResource(
  multer().any(),
  multiPartResourceHandler,
  shaclValidate.override({
    parseResource: req => req.parseFromMultipart(),
  }),
  (req: E.Request, res: E.Response, next: E.NextFunction) => {
    next(new Error('Not implemented'))
  })
