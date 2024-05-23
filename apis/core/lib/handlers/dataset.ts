import { PassThrough } from 'stream'
import toStream from 'rdf-dataset-ext/toStream.js'
import type { DatasetCore, NamedNode, Term } from '@rdfjs/types'
import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import parsePreferHeader from 'parse-prefer-header'
import $rdf from 'rdf-ext'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { loadLinkedResources } from '@hydrofoil/labyrinth/lib/query/eagerLinks'
import merge from 'merge2'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { cc, query, view } from '@cube-creator/core/namespace'
import { fromPointer } from '@rdfine/hydra/lib/IriTemplate'
import env from '@cube-creator/core/env'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dataset/update'
import { loadCubeShapes } from '../domain/queries/cube'
import * as clients from '../query-client'
import { getCubesAndGraphs } from '../domain/dataset/queries'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const pointer: { term: NamedNode; dataset: DatasetCore } = await req.hydra.resource.clownface()
    const dataset = await update({
      dataset: clownface(pointer),
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(200)
    await res.dataset(dataset.dataset)
  }),
)

export const get = protectedResource(asyncMiddleware(async (req, res) => {
  const { includeInLists } = parsePreferHeader(req.header('Prefer'))

  const ptr: { term: NamedNode; dataset: DatasetCore } = await req.hydra.resource.clownface()
  const dataset = clownface(ptr)
  const shapeStreams = [...await loadCubeShapes(req.hydra.resource.term, !includeInLists, clients)]
  const outStream = new PassThrough({
    objectMode: true,
  })

  const types = clownface({
    dataset: req.hydra.api.dataset,
    term: dataset.out(rdf.type).terms,
  })
  const linkedResources = await loadLinkedResources(dataset, types.out(query.include).toArray(), req.labyrinth.sparql)
  const observationsTemplateStream = await observationTemplate(dataset.term)

  merge([toStream(dataset.dataset), ...shapeStreams, linkedResources.toStream(), observationsTemplateStream], { objectMode: true })
    .pipe(outStream)

  return res.quadStream(outStream)
}))

async function observationTemplate(dataset: Term) {
  const results = await getCubesAndGraphs(dataset)
  const cf = clownface({ dataset: $rdf.dataset() })

  for (const { cube, graph } of results) {
    const template = fromPointer(cf.blankNode(), {
      template: `${env.API_CORE_BASE}observations?cube=${encodeURIComponent(cube.value)}&graph=${encodeURIComponent(graph.value)}{&view,pageSize,page}`,
      mapping: [{
        property: view.view,
        variable: 'view',
      }, {
        property: hydra.limit,
        variable: 'pageSize',
      }, {
        property: hydra.pageIndex,
        variable: 'page',
      }],
    })

    cf.node(cube).addOut(cc.observations, template.id)
  }

  return cf.dataset.toStream()
}
