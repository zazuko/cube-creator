import asyncMiddleware from 'middleware-async'
import { NO_CONTENT } from 'http-status'
import type { GraphPointer } from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import { hydra } from '@tpluscode/rdf-ns-builders'
import $rdf from '@cube-creator/env'
import { store } from '../store.js'
import { cascadeDelete } from '../domain/resource.js'
import { shaclValidate } from '../middleware/shacl.js'
import shapes from '../shapes/index.js'
import { update } from '../domain/shared-dimension.js'
import { rewrite } from '../rewrite.js'
import * as queries from '../domain/shared-dimension/queries.js'

export const DELETE = protectedResource(asyncMiddleware(async (req, res) => {
  await cascadeDelete({
    store: store(),
    term: req.hydra.resource.term,
    api: $rdf.clownface(req.hydra.api),
  })

  res.sendStatus(NO_CONTENT)
}))

export const put = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const hydraExpects = req.hydra.operation.out(hydra.expects).term
  let shape: GraphPointer | undefined
  if (hydraExpects?.termType === 'NamedNode') {
    shape = await shapes.get(hydraExpects)?.(req)
  }

  const dimension = await update({
    resource: rewrite(await req.resource()),
    store: store(),
    shape,
    queries,
  })

  return res.dataset(dimension.dataset)
}))
