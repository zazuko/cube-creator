import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import type { Request } from 'express'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import httpError from 'http-errors'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode, Quad } from 'rdf-js'
import { md } from '@cube-creator/core/namespace'
import { shaclValidate } from '../middleware/shacl'
import { getManagedDimensions, getManagedTerms } from '../domain/managed-dimensions'
import { create } from '../domain/managed-dimension'
import { store } from '../store'
import { parsingClient } from '../sparql'

interface CollectionHandler {
  memberType: NamedNode
  collectionType: NamedNode
  memberQuads: Quad[]
  req: Request
}

function getCollection({ req, memberQuads, memberType, collectionType }: CollectionHandler) {
  const dataset = $rdf.dataset(memberQuads)

  const graph = clownface({ dataset })
  const members = graph.has(rdf.type, memberType)

  return graph.node(req.hydra.term)
    .addOut(rdf.type, [hydra.Collection, collectionType])
    .addOut(hydra.member, members)
    .addOut(hydra.totalItems, members.terms.length)
}

export const get = asyncMiddleware(async (req, res) => {
  const collection = await getCollection({
    memberQuads: await getManagedDimensions().execute(parsingClient.query),
    collectionType: md.ManagedDimensions,
    memberType: schema.DefinedTermSet,
    req,
  })

  return res.dataset(collection.dataset)
})

export const getTerms = asyncMiddleware(async (req, res, next) => {
  const termSet = clownface({ dataset: await req.dataset() })
    .has(schema.inDefinedTermSet)
    .out(schema.inDefinedTermSet)

  const { term } = termSet
  if (!term) {
    return next(new httpError.NotFound())
  }

  const collection = await getCollection({
    memberQuads: await getManagedTerms(term).execute(parsingClient.query),
    memberType: schema.DefinedTerm,
    collectionType: md.ManagedDimensionTerms,
    req,
  })

  return res.dataset(collection.dataset)
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
