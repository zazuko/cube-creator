import asyncMiddleware from 'middleware-async'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { protectedResource } from '@hydrofoil/labyrinth/resource'
import { loadLinkedResources } from '@hydrofoil/labyrinth/lib/query/eagerLinks'
import { Quad, Quad_Subject as Subject, Term } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
import through, { TransformFunction } from 'through2'
import { PassThrough } from 'stream'
import merge from 'merge2'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { cc, cube, query, view } from '@cube-creator/core/namespace'
import { fromPointer } from '@rdfine/hydra/lib/IriTemplate'
import { shaclValidate } from '../middleware/shacl'
import { update } from '../domain/dataset/update'
import { loadCubeShapes } from '../domain/queries/cube'
import { streamClient } from '../query-client'
import env from '@cube-creator/core/env'

export const put = protectedResource(
  shaclValidate,
  asyncMiddleware(async (req, res) => {
    const dataset = await update({
      dataset: await req.hydra.resource.clownface(),
      resource: await req.resource(),
      store: req.resourceStore(),
    })
    await req.resourceStore().save()

    res.status(200)
    await res.dataset(dataset.dataset)
  }),
)

export const get = protectedResource(asyncMiddleware(async (req, res) => {
  const dataset = await req.hydra.resource.clownface()
  const shapeStream = await loadCubeShapes(req.hydra.resource.term, streamClient)
  const outStream = new PassThrough({
    objectMode: true,
  })

  const types = clownface({
    dataset: req.hydra.api.dataset,
    term: dataset.out(rdf.type).terms,
  })
  const linkedResources = await loadLinkedResources(dataset, types.out(query.include).toArray(), req.labyrinth.sparql)

  merge(dataset.dataset.toStream(), shapeStream, linkedResources.toStream(), { objectMode: true })
    .pipe(through.obj(injectHydraTemplate()))
    .pipe(outStream)

  return res.quadStream(outStream)
}))

function injectHydraTemplate(): TransformFunction {
  let graph: Term | undefined
  let cubeId: Subject | undefined
  const templateAdded = new TermSet()

  return function (quad: Quad, enc, callback) {
    this.push(quad)

    if (quad.predicate.equals(cc.cubeGraph)) {
      graph = quad.object
    }
    if (quad.predicate.equals(rdf.type) && quad.object.equals(cube.Cube)) {
      cubeId = quad.subject
    }

    if (cubeId && graph && !templateAdded.has(cubeId)) {
      const template = fromPointer(clownface({ dataset: $rdf.dataset() }).blankNode(), {
        template: `${env.API_CORE_BASE}observations?cube=${encodeURIComponent(cubeId.value)}&graph=${encodeURIComponent(graph.value)}{&view,pageSize,page}`,
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

      template.pointer.dataset.forEach(chunk => this.push(chunk))
      this.push($rdf.quad(cubeId, cc.observations, template.id))

      templateAdded.add(cubeId)
    }

    callback()
  }
}
