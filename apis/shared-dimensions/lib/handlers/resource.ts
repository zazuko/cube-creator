import asyncMiddleware from 'middleware-async'
import { NO_CONTENT } from 'http-status'
import clownface, { GraphPointer } from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { hydra } from '@tpluscode/rdf-ns-builders/strict'
import { store } from '../store'
import { cascadeDelete } from '../domain/resource'
import { shaclValidate } from '../middleware/shacl'
import shapes from '../shapes/index'
import { update } from '../domain/shared-dimension'
import { rewrite } from '../rewrite'
import * as queries from '../domain/shared-dimension/queries'

export const DELETE = protectedResource(asyncMiddleware(async (req, res) => {
  await cascadeDelete({
    store: store(),
    term: req.hydra.resource.term,
    api: clownface(req.hydra.api),
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
