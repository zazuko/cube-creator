import path from 'path'
import type { Quad, Stream, Term, Literal, NamedNode } from '@rdfjs/types'
import { hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { toRdf, fromRdf } from 'rdf-literal'
import { fromFile } from 'rdf-utils-fs'
import clownface from 'clownface'
import { isResource } from 'is-graph-pointer'
import { StreamClient } from 'sparql-http-client/StreamClient'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { md } from '@cube-creator/core/namespace'
import env from '../env'
import shapeToQuery, { rewriteTemplates } from '../shapeToQuery'
import { CollectionData } from '../handlers/collection'
import { getDynamicProperties } from './shared-dimension'

interface GetSharedDimensions {
  freetextQuery?: string
  limit?: number
  offset?: number
  includeDeprecated?: Literal
}

export async function getSharedDimensions(client: StreamClient, { freetextQuery = '', limit = 10, offset = 0, includeDeprecated }: GetSharedDimensions = {}): Promise<CollectionData<Iterable<Quad>>> {
  const { constructQuery } = await shapeToQuery()

  const memberQueryShape = await loadShape('dimensions-query-shape', md.MembersQueryShape)
  const totalQueryShape = await loadShape('dimensions-query-shape', md.CountQueryShape)

  const { MANAGED_DIMENSIONS_BASE } = env
  const variables = new Map(Object.entries({
    MANAGED_DIMENSIONS_BASE,
    limit,
    offset,
    freetextQuery,
    includeDeprecated,
    orderBy: schema.name,
  }))
  await rewriteTemplates(memberQueryShape, variables)
  await rewriteTemplates(totalQueryShape, variables)

  const dataset = await $rdf.dataset().import(await client.query.construct(constructQuery(memberQueryShape)))
  clownface({ dataset })
    .has(rdf.type, schema.DefinedTermSet)
    .forEach(termSet => {
      termSet.addOut(md.export, $rdf.namedNode(`${MANAGED_DIMENSIONS_BASE}dimension/_export?dimension=${termSet.value}`))
      termSet.addOut(md.terms, $rdf.namedNode(`${MANAGED_DIMENSIONS_BASE}dimension/_terms?dimension=${termSet.value}`))
    })

  const totalItems = clownface({
    dataset: await $rdf.dataset().import(await client.query.construct(constructQuery(totalQueryShape))),
  }).has(hydra.totalItems).out(hydra.totalItems).term as Literal

  return {
    members: dataset,
    totalItems: fromRdf(totalItems),
  }
}

interface GetSharedTerms {
  sharedDimensions: Term[]
  freetextQuery: string | undefined
  limit?: number
  offset?: number
  validThrough?: Date
}

export async function getSharedTerms<C extends StreamClient | ParsingClient>({ sharedDimensions, freetextQuery, validThrough, limit = 10, offset = 0 }: GetSharedTerms, client: C): Promise<CollectionData<C extends StreamClient ? Stream : Quad[]>> {
  const shape = await loadShape('terms-query-shape')

  shape.addOut(sh.targetNode, sharedDimensions)

  shape.any().has(sh.limit).deleteOut(sh.limit).addOut(sh.limit, limit)
  shape.any().has(sh.offset).deleteOut(sh.offset).addOut(sh.offset, offset)

  const filterShape = shape.any().has(sh.filterShape).out(sh.filterShape)

  const dynamicProperties = await getDynamicProperties(sharedDimensions)
  dynamicProperties.forEach(predicate => {
    shape.out(sh.property).out(sh.node).addOut(sh.property, propertyShape => {
      propertyShape.addOut(sh.path, predicate)
    })
  })

  if (freetextQuery) {
    filterShape
      .out(sh.property)
      .has(sh.path, schema.name)
      .addOut(hydra.freetextQuery, freetextQuery)
  }

  if (validThrough) {
    const placeholder = $rdf.literal('VALID-THROUGH')
    filterShape.out(sh.expression).deleteOut(sh.deactivated)
    filterShape.dataset.match(null, null, placeholder).forEach((quad) => {
      filterShape.dataset.delete(quad).add($rdf.quad(quad.subject, quad.predicate, toRdf(validThrough), quad.graph))
    })
  }

  const { constructQuery } = await shapeToQuery()
  return client.query.construct(constructQuery(shape), {
    operation: 'postDirect',
  }) as any
}

async function loadShape(shape: string, shapeType: NamedNode = sh.NodeShape) {
  const dataset = await $rdf.dataset().import(fromFile(path.resolve(__dirname, `../shapes/${shape}.ttl`)))

  const ptr = clownface({
    dataset,
  }).has(rdf.type, shapeType)

  if (!isResource(ptr)) {
    throw new Error('Expected a single blank node or named node')
  }

  return ptr
}
