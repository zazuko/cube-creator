import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { Enrichment } from '@hydrofoil/labyrinth/lib/middleware/preprocessResource'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { cc, cube, view } from '@cube-creator/core/namespace'
import { IriTemplateMixin } from '@rdfine/hydra'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dataset/update'
import { loadCubeShapes } from '../domain/queries/cube'
import { streamClient } from '../query-client'
import env from '@cube-creator/core/env'

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

  dataset.any().has(rdf.type, cube.Cube).forEach(cube => {
    cube.addOut(cc.observations, template => {
      return new IriTemplateMixin.Class(template, {
        template: `${env.API_CORE_BASE}observations?cube=${cube.value}{&view,pageSize}`,
        mapping: [{
          property: view.view,
          variable: 'view',
        }, {
          property: hydra.limit,
          variable: 'pageSize',
        }],
      })
    })
  })
}
