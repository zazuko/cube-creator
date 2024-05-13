import asyncMiddleware from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import { schema } from '@tpluscode/rdf-ns-builders'
import cors from 'cors'
import $rdf from '@cube-creator/env'
import formats from '@rdfjs-elements/formats-pretty'
import error from 'http-errors'
import { md, meta } from '@cube-creator/core/namespace'
import * as ns from '@tpluscode/rdf-ns-builders'
import { createTerm, getExportedDimension } from '../domain/shared-dimension.js'
import { store } from '../store.js'
import { shaclValidate } from '../middleware/shacl.js'
import { rewrite } from '../rewrite.js'

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const term = await createTerm({
    resource: rewrite(await req.resource()),
    termSet: $rdf.clownface({ dataset: await req.hydra.resource.dataset() }).node(req.hydra.term),
    store: store(),
  })

  res.setHeader('Location', term.value)
  res.status(201)
  return res.dataset(term.dataset)
}))

export const getExport = protectedResource(cors({ exposedHeaders: 'content-disposition' }), asyncMiddleware(async (req, res, next) => {
  if (!req.dataset) {
    return next(new error.BadRequest())
  }
  const query = $rdf.clownface({ dataset: await req.dataset() })
  const termSet: any = query
    .has(schema.inDefinedTermSet)
    .out(schema.inDefinedTermSet)
    .term

  const { dimension, data } = await getExportedDimension({
    resource: termSet,
    store: store(),
  })

  const name = dimension.out(schema.name, { language: ['en', '*'] })?.value || 'dimension'

  res.setHeader('Content-Disposition', `attachment; filename="${name}.trig"`)
  res.setHeader('Content-Type', 'application/trig')

  const quadStream: any = formats.serializers.import('application/trig', data, {
    prefixes: {
      md: md().value,
      meta: meta().value,
      schema: ns.schema().value,
      sh: ns.sh().value,
      rdf: ns.rdf().value,
      rdfs: ns.rdfs().value,
      xsd: ns.xsd().value,
      hydra: ns.hydra().value,
    },
  })
  quadStream.pipe(res)
}))
