import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import * as error from 'http-errors'
import { IriTemplate, IriTemplateMixin } from '@rdfine/hydra'
import clownface, { AnyContext, AnyPointer } from 'clownface'
import $rdf from 'rdf-ext'
import Parser from '@rdfjs/parser-n3'
import toStream from 'string-to-stream'
import { getObservations } from '../domain/observations'
import DatasetExt from 'rdf-ext/lib/Dataset'
import RdfResourceImpl from '@tpluscode/rdfine'
import * as ns from '@cube-creator/core/namespace'
import { cc, hydraBox } from '@cube-creator/core/namespace'
import { warning } from '../log'
import { hydra } from '@tpluscode/rdf-ns-builders'

const parser = new Parser()

export const query = protectedResource(
  asyncMiddleware(async (req, res, next) => {
    if (!req.dataset) {
      return next(new error.BadRequest())
    }

    const query = clownface({ dataset: await req.dataset() }).has(cc.cube)

    const cubeId = query.out(cc.cube).value
    if (!cubeId) {
      return next(new error.BadRequest("Missing 'cube' query parameter"))
    }

    const pageSize = Number.parseInt(query.out(hydra.limit).value || '0')
    const sourceGraph = query.out(cc.cubeGraph).value
    if (!sourceGraph) {
      return next(new error.BadRequest("Missing 'graph' query parameter"))
    }

    let filters: AnyPointer<AnyContext, DatasetExt> | undefined
    const viewArgument = query.out(ns.view.view).value
    if (viewArgument) {
      try {
        filters = clownface({ dataset: await $rdf.dataset().import(parser.import(toStream(viewArgument))) })
      } catch (e) {
        warning('Failed to parse cube view')
        warning(e.toString())
        return next(new error.BadRequest('Malformed cube view'))
      }
    }

    const templatePointer = req.hydra.operation.out(hydraBox.variables).toArray()[0]
    const template = RdfResourceImpl.factory.createEntity<IriTemplate>(templatePointer, [IriTemplateMixin])
    const collection = await getObservations({
      sourceGraph,
      pageSize,
      cubeId,
      template,
      filters,
      templateParams: query.toArray()[0],
    })

    res.setLink(collection.view[0].id.value, 'canonical')
    return res.dataset(collection.pointer.dataset)
  }),
)
