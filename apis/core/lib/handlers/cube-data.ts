import error from 'http-errors'
import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import asyncMiddleware from 'middleware-async'
import $rdf from '@zazuko/env'
import { describeResource } from '../domain/queries/cube-data.js'
import { parsingClient, publicClient } from '../query-client.js'

export const get = protectedResource(asyncMiddleware(async (req, res, next) => {
  const resourceUri = req.query.resource
  if (!resourceUri || typeof resourceUri !== 'string') {
    return next(new error.BadRequest("Missing 'resource' query parameter"))
  }

  const graph = req.hydra.term
  const resourceId = $rdf.namedNode(resourceUri)

  let params
  if (req.query.sharedTerm === 'true') {
    params = { resourceId, client: publicClient }
  } else {
    params = { graph, resourceId, client: parsingClient }
  }

  const quads = await describeResource(params)

  return res.dataset($rdf.dataset(quads))
}))
