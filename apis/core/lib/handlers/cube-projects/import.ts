import { protectedResource } from '@hydrofoil/labyrinth/resource'
import multer from 'multer'
import { parsers } from '@rdfjs-elements/formats-pretty'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import E from 'express'
import once from 'once'
import { NamedNode, Stream } from 'rdf-js'
import { BadRequest } from 'http-errors'
import asyncMiddleware from 'middleware-async'
import { Readable } from 'stream'
import { INSERT } from '@tpluscode/sparql-builder'
import mime from 'mime-types'
import { Project } from '@cube-creator/model'
import { shaclValidate } from '../../middleware/shacl'
import { adjustTerms, Files, importProject } from '../../domain/cube-projects/import'
import { streamClient } from '../../query-client'

declare module 'express-serve-static-core' {
  interface Request {
    parseFromMultipart(): Promise<GraphPointer<NamedNode>>
  }
}

// eslint-disable-next-line no-undef
export function parseFile(file: Express.Multer.File, baseIRI: string): Stream & Readable {
  const mimeType = mime.lookup(file.originalname)

  let parserStream = parsers.import(file.mimetype, Readable.from(file.buffer), {
    baseIRI,
  })

  if (!parserStream && mimeType) {
    parserStream = parsers.import(mimeType, Readable.from(file.buffer), {
      baseIRI,
    })
  }

  if (!parserStream) {
    throw new BadRequest(`Parser not found for file ${file.originalname}`)
  }

  return parserStream as any
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

    return clownface({
      dataset: await $rdf.dataset().import(parseFile(representation, req.hydra.term.value)),
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
  asyncMiddleware(async (req, res) => {
    let files: Files = {}
    if (Array.isArray(req.files)) {
      files = req.files.reduce((files, file) => {
        return {
          ...files,
          [file.fieldname]: (project: Project) => parseFile(file, project.id.value + '/').pipe(adjustTerms(project)),
        }
      }, {})
    }

    const user = req.user?.id
    const userName = req.user?.name

    if (!user || !userName) {
      throw new Error('User is not defined')
    }

    const { project, importedDataset } = await importProject({
      projectsCollection: await req.hydra.resource.clownface(),
      resource: await req.parseFromMultipart(),
      files,
      store: req.resourceStore(),
      user,
      userName,
    })
    await req.resourceStore().save()
    await INSERT.DATA`${importedDataset}`.execute(streamClient.query)

    res.status(201)
    res.header('Location', project.pointer.value)
    await res.dataset(project.pointer.dataset)
  }))
