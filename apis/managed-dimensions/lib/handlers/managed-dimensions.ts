import { schema } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import httpError from 'http-errors'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { shaclValidate } from '../middleware/shacl'
import { getManagedDimensions, getManagedTerms } from '../domain/managed-dimensions'
import { create } from '../domain/managed-dimension'
import { store } from '../store'

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

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await create({
    resource: await req.resource(),
    store: store(),
  })

  res.setHeader('Location', pointer.value)
  res.status(201)
  return res.dataset(pointer.dataset)
}))
