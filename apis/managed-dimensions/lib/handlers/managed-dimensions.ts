import { schema } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import httpError from 'http-errors'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { getManagedDimensions, getManagedTerms } from '../domain/managed-dimensions'

export const get = asyncMiddleware(async (req, res) => {
  const query = await getManagedDimensions(req.hydra.term)
    .execute(req.labyrinth.sparql.query)

  return res.quadStream(query)
})

export const getTerms = asyncMiddleware(async (req, res, next) => {
  const termSet = clownface({ dataset: await req.dataset() })
    .has(schema.inDefinedTermSet)
    .out(schema.inDefinedTermSet)

  if (!termSet.term) {
    return next(new httpError.NotFound())
  }

  const collection = await $rdf.dataset().import(await getManagedTerms(termSet.term, req.hydra.term)
    .execute(req.labyrinth.sparql.query))

  if (collection.size === 0) {
    return next(new httpError.NotFound())
  }

  return res.dataset(collection)
})
