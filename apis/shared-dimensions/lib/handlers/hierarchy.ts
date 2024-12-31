import type { Quad } from '@rdfjs/types'
import { dcterms, schema, sd } from '@tpluscode/rdf-ns-builders'
import { asyncMiddleware } from 'middleware-async'
import $rdf from 'rdf-ext'
import env from '@cube-creator/core/env'
import { md, meta } from '@cube-creator/core/namespace'
import onetime from 'onetime'
import { sh } from '@tpluscode/rdf-ns-builders/strict'
import { isGraphPointer, isNamedNode } from 'is-graph-pointer'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import sharedDimensionsEnv from '../env'
import { ShouldRewrite } from '../middleware/canonicalRewrite'
import shapeToQuery from '../shapeToQuery'
import { loadShapes } from '../store/shapes'
import { parsingClient } from '../sparql'

export const get = asyncMiddleware(async (req, res) => {
  const hierarchy: any = await req.hydra.resource.clownface()

  ensureEndpoint(hierarchy)

  const noRewriteRoots: ShouldRewrite = (quad: Quad) => {
    if (quad.predicate.equals(meta.hierarchyRoot)) {
      return {
        object: false,
      }
    }

    return true
  }

  res.locals.noRewrite = noRewriteRoots

  return res.dataset(hierarchy.dataset)
})

const loadShapesOnce = onetime(loadShapes)

export const getExternal = asyncMiddleware(async (req, res) => {
  const shape: AnyPointer = (await loadShapesOnce()).has(sh.targetClass, md.Hierarchy)

  if (!isGraphPointer(shape)) {
    throw new Error('Shape not found')
  }

  const queryParams = clownface({ dataset: await req.dataset!() })
  const focusNode = queryParams.out(schema.identifier)
  if (!isNamedNode(focusNode)) {
    throw new Error('Missing or invalid id param')
  }

  const url = new URL(focusNode.value, sharedDimensionsEnv.MANAGED_DIMENSIONS_BASE).toString()
  const { constructQuery } = await shapeToQuery()
  const query = constructQuery(shape, {
    focusNode: $rdf.namedNode(url),
  })

  const hierarchy = clownface({
    dataset: $rdf.dataset(await parsingClient.query.construct(query)),
  }).namedNode(url)
  ensureEndpoint(hierarchy)

  res.setLink(url, 'canonical')
  return res.dataset(hierarchy.dataset)
})

function ensureEndpoint(hierarchy: GraphPointer) {
  if (!hierarchy.out(dcterms.source).terms.length) {
    hierarchy.addOut(dcterms.source, source => {
      source
        .addOut(sd.endpoint, $rdf.namedNode(env.PUBLIC_QUERY_ENDPOINT))
    })
  }
}
