import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import asyncMiddleware from 'middleware-async'
import { parsingClient } from '@cube-creator/managed-dimensions-api/lib/sparql'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dimension/update'
import { getMappedDimensions } from '../domain/queries/dimension-metadata'

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
