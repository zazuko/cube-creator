import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { schema } from '@tpluscode/rdf-ns-builders'
import asyncMiddleware from 'middleware-async'
import error from 'http-errors'
import $rdf from 'rdf-ext'
import { shaclValidateTargetNode } from '../middleware/shacl'
import { update } from '../domain/dimension/update'

const findDimensionMetadataTerm = asyncMiddleware(async (req, res, next) => {
  const dimensionIri = req.query.dimension
  if (typeof dimensionIri !== 'string') {
    return next(new error.BadRequest('Missing or invalid dimension query string'))
  }

  const requestBody = await req.resource()
  res.locals.dimensionMetadata = requestBody.any().has(schema.about, $rdf.namedNode(dimensionIri)).toArray()[0]
  if (!res.locals.dimensionMetadata) {
    return next(new error.BadRequest('Missing metadata in body'))
  }

  next()
})

export const put = protectedResource(
  findDimensionMetadataTerm,
  shaclValidateTargetNode({
    getTargetNode: (req, res) => res.locals.dimensionMetadata.term,
  }),
  asyncMiddleware(async (req, res) => {
    const updated = await update({
      metadataCollection: req.hydra.term,
      dimensionMetadata: res.locals.dimensionMetadata,
    })

    return res.dataset(updated.dataset)
  }),
)
