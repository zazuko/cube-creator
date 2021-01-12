import * as error from 'http-errors'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import $rdf from 'rdf-ext'
import { describeResource } from '../domain/queries/cube-data'

export const get = protectedResource(asyncMiddleware(async (req, res, next) => {
  const resourceUri = req.query.resource
  if (!resourceUri || typeof resourceUri !== 'string') {
    return next(new error.BadRequest("Missing 'resource' query parameter"))
  }

  const graph = req.hydra.term
  const resourceId = $rdf.namedNode(resourceUri)

  const quads = await describeResource(graph, resourceId)

  return res.dataset($rdf.dataset(quads))
}))
