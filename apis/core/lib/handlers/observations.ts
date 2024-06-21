import { protectedResource } from '@hydrofoil/labyrinth/resource.js'
import asyncMiddleware from 'middleware-async'
import error from 'http-errors'
import { IriTemplate, IriTemplateMixin } from '@rdfine/hydra'
import type { AnyContext, AnyPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import toStream from 'string-to-stream'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import * as ns from '@cube-creator/core/namespace'
import { cc, hydraBox } from '@cube-creator/core/namespace'
import { hydra } from '@tpluscode/rdf-ns-builders'
import { warning } from '../log.js'
import { getObservations } from '../domain/observations/index.js'

export const query = protectedResource(
  asyncMiddleware(async (req, res, next) => {
    if (!req.dataset) {
      return next(new error.BadRequest())
    }

    const query = $rdf.clownface({ dataset: await req.dataset() }).has(cc.cube)

    const cubeId = query.out(cc.cube).value
    if (!cubeId) {
      return next(new error.BadRequest("Missing 'cube' query parameter"))
    }

    const pageSizeParam = query.out(hydra.limit).value
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam) : undefined
    const pageIndexParam = query.out(hydra.pageIndex).value
    const pageIndex = pageIndexParam ? Number.parseInt(pageIndexParam) : undefined
    const sourceGraph = query.out(cc.cubeGraph).value
    if (!sourceGraph) {
      return next(new error.BadRequest("Missing 'graph' query parameter"))
    }

    let filters: AnyPointer<AnyContext, DatasetExt> | undefined
    const viewArgument = query.out(ns.view.view).value
    if (viewArgument) {
      try {
        filters = $rdf.clownface({ dataset: await $rdf.dataset().import($rdf.formats.parsers.import('text/turtle', toStream(viewArgument))!) })
      } catch (e: any) {
        warning('Failed to parse cube view')
        warning(e.toString())
        return next(new error.BadRequest('Malformed cube view'))
      }
    }

    const templatePointer = req.hydra.operation.out(hydraBox.variables).toArray()[0]
    const template = $rdf.rdfine().factory.createEntity<IriTemplate>(templatePointer, [IriTemplateMixin])
    const collection = await getObservations({
      sourceGraph,
      pageSize,
      pageIndex,
      cubeId,
      template,
      filters,
      templateParams: query.toArray()[0],
    })

    res.setLink(collection.view[0].id.value, 'canonical')
    return res.dataset(collection.pointer.dataset)
  }),
)
