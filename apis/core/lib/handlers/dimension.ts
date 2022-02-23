import { NamedNode } from 'rdf-js'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import asyncMiddleware from 'middleware-async'
import { parsingClient } from '@cube-creator/shared-dimensions-api/lib/sparql'
import { cube } from '@cube-creator/core/namespace'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { Request } from 'express'
import { GraphPointer } from 'clownface'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension/update'
import { getDimensionTypes, getMappedDimensions } from '../domain/queries/dimension-metadata'
import * as client from '../query-client'

export const get = protectedResource(asyncMiddleware((req, res) => {
  return res.quadStream(req.hydra.resource.quadStream())
}))

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const updated = await update({
      metadataCollection: req.hydra.resource.term,
      dimensionMetadata: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    return res.dataset(updated.dataset)
  }),
)

export const loadSharedDimensions: Enrichment = async (req, pointer) => {
  const quads = await getMappedDimensions(pointer, parsingClient)

  for (const quad of quads) {
    pointer.dataset.add(quad)
  }
}

interface PreselectDimensionType {
  (req: Request, pointer: GraphPointer<NamedNode>, sparql?: ParsingClient): Promise<void>
}

export const preselectDimensionType: PreselectDimensionType = async (req, pointer, sparql: ParsingClient = client.parsingClient) => {
  const dimensionTypes = await getDimensionTypes(pointer, req.resourceStore(), sparql)

  pointer.out(schema.hasPart)
    .forEach((dimension: GraphPointer) => {
      const predicate = dimension.out(schema.about).term
      if (!predicate) return

      const hasDimensionType = dimension.has(rdf.type, [cube.KeyDimension, cube.MeasureDimension]).terms.length > 0
      const dimensionType = dimensionTypes.get(predicate)

      if (!hasDimensionType && dimensionType) {
        dimension.addOut(rdf.type, dimensionType)
      }
    })
}
