import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dataset/update'
import { loadCubeShapes } from '../domain/queries/cube'
import { streamClient } from '../query-client'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const dataset = await update({
      dataset: clownface(req.hydra.resource),
      resource: await req.resource(),
    })

    res.status(200)
    await res.dataset(dataset.dataset)
  }),
)

export const loadCubes: Enrichment = async (req, dataset) => {
  const shapeQuads = await loadCubeShapes(dataset, streamClient)

  for await (const quad of shapeQuads) {
    dataset.dataset.add(quad)
  }
}
