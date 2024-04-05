import path from 'path'
import type { Quad, Stream, Term } from '@rdfjs/types'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { hydra, rdf, schema, sh } from '@tpluscode/rdf-ns-builders'
import { md, meta } from '@cube-creator/core/namespace'
import $rdf from '@zazuko/env'
import { toRdf } from 'rdf-literal'
import { fromFile } from 'rdf-utils-fs'
import { isGraphPointer } from 'is-graph-pointer'
import { StreamClient } from 'sparql-http-client/StreamClient.js'
import { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import env from '../env.js'
import shapeToQuery from '../shapeToQuery.js'
import { getDynamicProperties } from './shared-dimension/index.js'

export function getSharedDimensions() {
  return CONSTRUCT`
    ?termSet ?p ?o .
    ?termSet ${md.terms} ?terms .
    ?termSet ${md.export} ?export .
  `
    .WHERE`
      ?termSet a ${schema.DefinedTermSet}, ${meta.SharedDimension} .
      ?termSet ?p ?o .

      MINUS { ?termSet ${md.export} ?o }

      BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_terms?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?terms )

      OPTIONAL {
        ?termSet a ${md.SharedDimension} .
        BIND ( IRI(CONCAT("${env.MANAGED_DIMENSIONS_BASE}", "dimension/_export?dimension=", ENCODE_FOR_URI(STR(?termSet)))) as ?export )
      }
    `
}

interface GetSharedTerms {
  sharedDimensions: Term[]
  freetextQuery: string | undefined
  limit?: number
  offset?: number
  validThrough?: Date
}

export async function getSharedTerms<C extends StreamClient | ParsingClient>({ sharedDimensions, freetextQuery, validThrough, limit = 10, offset = 0 }: GetSharedTerms, client: C): Promise<C extends StreamClient ? Stream : Quad[]> {
  const shape = await loadShape()
  if (!isGraphPointer(shape)) {
    throw new Error('Multiple shapes found')
  }

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
  return constructQuery(shape).execute(client) as any
}

async function loadShape() {
  const dataset = await $rdf.dataset().import(fromFile(path.resolve(__dirname, '../shapes/terms-query-shape.ttl')))

  return $rdf.clownface({
    dataset,
  }).has(rdf.type, sh.NodeShape)
}
