import { hydra, oa, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import httpError from 'http-errors'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { NamedNode, Quad, Term } from 'rdf-js'
import * as error from 'http-errors'
import { md } from '@cube-creator/core/namespace'
import { shaclValidate } from '../middleware/shacl'
import { getSharedDimensions, getSharedTerms } from '../domain/shared-dimensions'
import { create } from '../domain/shared-dimension'
import { store } from '../store'
import { parsingClient } from '../sparql'
import env from '../env'
import { rewrite, rewriteTerm } from '../rewrite'
import conditional from 'express-conditional-middleware'
import { isMultipart } from '@cube-creator/express/multipart'
import { postImportedDimension } from './shared-dimension/import'

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

function termsCollectionId(dimension: Term, search?: string) {
  const uri = new URL(`${env.MANAGED_DIMENSIONS_BASE}dimension/_terms`)
  uri.searchParams.set('dimension', dimension.value)

  if (search) {
    uri.searchParams.set('q', search)
  }

  return $rdf.namedNode(uri.toString())
}

export const getTerms = asyncMiddleware(async (req, res, next) => {
  if (!req.dataset) {
    return next(new error.BadRequest())
  }

  const query = clownface({ dataset: await req.dataset() })
  const termSet = query
    .has(schema.inDefinedTermSet)
    .out(schema.inDefinedTermSet)

  const { term } = termSet
  if (!term) {
    return next(new httpError.NotFound())
  }

  const pageSize = Number(query.out(hydra.limit).value || 10)
  const page = Number(query.out(hydra.pageIndex).value || 1)
  const offset = (page - 1) * pageSize
  const queryParams = {
    sharedDimension: rewriteTerm(term),
    freetextQuery: query.has(hydra.freetextQuery).out(hydra.freetextQuery).value,
    validThrough: query.has(md.onlyValidTerms, query.literal(true)).terms.length ? new Date() : undefined,
    limit: pageSize,
    offset,
  }

  const collection = await getCollection({
    memberQuads: await getSharedTerms(queryParams).execute(parsingClient.query),
    memberType: schema.DefinedTerm,
    collectionType: md.SharedDimensionTerms,
    collection: termsCollectionId(term, queryParams.freetextQuery),
  })

  collection.out(hydra.member)
    .forEach((member: GraphPointer) => {
      member.addOut(oa.canonical, member)
    })

  res.setLink(collection.value, 'canonical')
  return res.dataset(collection.dataset)
})

const postDirect = protectedResource(shaclValidate, asyncMiddleware(async (req, res) => {
  const pointer = await create({
    resource: rewrite(await req.resource()),
    store: store(),
  })

  res.setHeader('Location', pointer.value)
  res.status(201)
  return res.dataset(pointer.dataset)
}))

export const post = conditional(isMultipart, postImportedDimension, postDirect)

export const injectTermsLink: Enrichment = async (req, pointer) => {
  pointer.deleteOut(md.terms).addOut(md.terms, termsCollectionId(pointer.term))
}

export const injectExportLink: Enrichment = async (req, pointer) => {
  pointer.addOut(md.export, pointer.namedNode(`${env.MANAGED_DIMENSIONS_BASE}dimension/_export?dimension=${pointer.value}`))
}
