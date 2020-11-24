import { protectedResource } from '@hydrofoil/labyrinth/resource'
import asyncMiddleware from 'middleware-async'
import * as error from 'http-errors'
import { CollectionMixin, IriTemplateMixin } from '@rdfine/hydra'
import clownface, { AnyPointer } from 'clownface'
import $rdf from 'rdf-ext'
import Parser from '@rdfjs/parser-n3'
import toStream from 'string-to-stream'
import Cube from 'rdf-cube-view-query'
import env from '@cube-creator/core/env'
import * as ns from '@cube-creator/core/namespace'
import { cc, hydraBox } from '@cube-creator/core/namespace'
import { warning } from '../log'
import { hydra } from '@tpluscode/rdf-ns-builders'

const DEFAULT_PAGE_SIZE = 20
const parser = new Parser()

export const query = protectedResource(
  asyncMiddleware(async (req, res, next) => {
    const source = new Cube.Source({
      endpointUrl: env.STORE_QUERY_ENDPOINT,
      user: env.maybe.STORE_ENDPOINTS_USERNAME,
      password: env.maybe.STORE_ENDPOINTS_PASSWORD,
      sourceGraph: 'https://cube-creator.lndo.site/cube-project/ubd/cube-data',
    })

    if (!req.dataset) {
      return next(new error.BadRequest())
    }

    const query = clownface({ dataset: await req.dataset() }).has(cc.cube)
    const cubeId = query.out(cc.cube).value
    const pageSize = Number.parseInt(query.out(hydra.limit).value || '0')

    let view: AnyPointer | undefined
    const viewArgument = query.out(ns.view.view).value
    if (viewArgument) {
      try {
        view = clownface({ dataset: await $rdf.dataset().import(parser.import(toStream(viewArgument))) })
      } catch (e) {
        warning('Failed to parse cube view')
        warning(e.toString())
        return next(new error.BadRequest('Malformed cube view'))
      }
    }

    const cubes = await source.cubes()
    const cube = cubes.find(({ ptr }) => ptr.value === cubeId)
    if (!cube) {
      return next(new error.BadRequest(`Cube not found: '${cubeId}'`))
    }

    const cubeView = Cube.View.fromCube(cube)

    view?.has(ns.view.dimension)
      .forEach(requestedFilter => {
        const cubeDimension = requestedFilter.out(ns.view.dimension).term
        const operation = requestedFilter.out(ns.view.operation).term
        const argument = requestedFilter.out(ns.view.argument).term

        const dimension = cubeView.dimension({ cubeDimension })
        if (dimension && operation && argument) {
          cubeView.ptr.addOut(ns.view.filter, filter => {
            filter.addOut(ns.view.dimension, dimension.ptr)
            filter.addOut(ns.view.operation, operation)
            filter.addOut(ns.view.argument, argument)
          })
        }
      })

    const queryTemplate = new IriTemplateMixin.Class(req.hydra.operation.out(hydraBox.variables).toArray()[0] as any)
    const collectionId = queryTemplate.expand(clownface({ dataset: $rdf.dataset() }).blankNode().addOut(cc.cube, cube.ptr))

    const observations = await cubeView.observations()
    const collectionPointer = clownface({ dataset: $rdf.dataset() })
      .namedNode(new URL(collectionId, env.API_CORE_BASE).toString())
    const collection = new CollectionMixin.Class(collectionPointer, {
      member: observations.slice(0, pageSize || DEFAULT_PAGE_SIZE),
      totalItems: observations.length,
      view: {
        id: req.absoluteUrl(),
      },
    })

    return res.dataset(collection.pointer.dataset)
  }),
)
