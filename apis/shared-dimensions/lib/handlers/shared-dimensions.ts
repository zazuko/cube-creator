import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import httpError from 'http-errors'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode, Quad, Term } from 'rdf-js'
import { md } from '@cube-creator/core/namespace'
import { shaclValidate } from '../middleware/shacl'
import { getSharedDimensions, getSharedTerms } from '../domain/shared-dimensions'
import { create } from '../domain/shared-dimension'
import { store } from '../store'
import { parsingClient } from '../sparql'
import env from '../env'
import { rewrite, rewriteTerm } from '../rewrite'

interface CollectionHandler {
  memberType: NamedNode
  collectionType: NamedNode
  memberQuads: Quad[]
  collection: NamedNode
}

function getCollection({ collection, memberQuads, memberType, collectionType }: CollectionHandler) {
  const dataset = $rdf.dataset(memberQuads)

  const graph = clownface({ dataset })
  const members = graph.has(rdf.type, memberType)

  return graph.node(collection)
    .addOut(rdf.type, [hydra.Collection, collectionType])
    .addOut(hydra.member, members)
    .addOut(hydra.totalItems, members.terms.length)
}

export const get = asyncMiddleware(async (req, res) => {
  const collection = await getCollection({
    memberQuads: await getSharedDimensions().execute(parsingClient.query),
    collectionType: md.SharedDimensions,
    memberType: schema.DefinedTermSet,
    collection: req.hydra.resource.term,
  })

  return res.dataset(collection.dataset)
})

function termsCollectionId(dimension: Term) {
  return $rdf.namedNode(`${env.MANAGED_DIMENSIONS_BASE}dimension/_terms?dimension=${encodeURIComponent(dimension.value)}`)
}

export const getTerms = asyncMiddleware(async (req, res, next) => {
  const termSet = clownface({ dataset: await req.dataset() })
    .has(schema.inDefinedTermSet)
    .out(schema.inDefinedTermSet)

  const { term } = termSet
  if (!term) {
    return next(new httpError.NotFound())
  }

  const collection = await getCollection({
    memberQuads: await getSharedTerms(rewriteTerm(term)).execute(parsingClient.query),
    memberType: schema.DefinedTerm,
    collectionType: md.SharedDimensionTerms,
    collection: termsCollectionId(term),
  })

  res.setLink(req.absoluteUrl(), 'canonical')
  return res.dataset(collection.dataset)
})

export const post = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await create({
    resource: rewrite(await req.resource()),
    store: store(),
  })

  res.setHeader('Location', pointer.value)
  res.status(201)
  return res.dataset(pointer.dataset)
}))

export const injectTermsLink: Enrichment = async (req, pointer) => {
  pointer.deleteOut(md.terms).addOut(md.terms, termsCollectionId(pointer.term))
}
