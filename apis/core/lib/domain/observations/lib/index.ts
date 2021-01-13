import CubeQuery from 'rdf-cube-view-query'
import { Source } from 'rdf-cube-view-query/lib/Source'
import { View } from 'rdf-cube-view-query/lib/View'
import { Cube } from 'rdf-cube-view-query/lib/Cube'
import env from '@cube-creator/core/env'
import * as ns from '@cube-creator/core/namespace'
import clownface, { AnyPointer, GraphPointer } from 'clownface'
import { Collection, CollectionMixin, IriTemplate } from '@rdfine/hydra'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { Term } from 'rdf-js'
import { hydra } from '@tpluscode/rdf-ns-builders'

export function createSource(sourceGraph: string): Source {
  return new CubeQuery.Source({
    endpointUrl: env.STORE_QUERY_ENDPOINT,
    user: env.maybe.STORE_ENDPOINTS_USERNAME,
    password: env.maybe.STORE_ENDPOINTS_PASSWORD,
    sourceGraph,
  })
}

export function populateFilters(view: View, filters: AnyPointer): void {
  filters.has(ns.view.dimension)
    .forEach(requestedFilter => {
      const cubeDimension = requestedFilter.out(ns.view.dimension).term
      const operation = requestedFilter.out(ns.view.operation).term
      const argument = requestedFilter.out(ns.view.argument).term

      const dimension = view.dimension({ cubeDimension })
      if (dimension && operation && argument) {
        view.ptr.addOut(ns.view.filter, filter => {
          filter.addOut(ns.view.dimension, dimension.ptr)
          filter.addOut(ns.view.operation, operation)
          filter.addOut(ns.view.argument, argument)
        })
      }
    })
}

export function createView(cube: Cube, pageSize: number, offset: number): View {
  const view = CubeQuery.View.fromCube(cube)

  view.ptr.addOut(ns.view.projection, projection => {
    const order = projection.blankNode()
      .addOut(ns.view.dimension, view.dimensions[0].ptr)
      .addOut(ns.view.direction, ns.view.Ascending)

    projection.addList(ns.view.orderBy, order)
    projection.addOut(ns.view.limit, pageSize)
    projection.addOut(ns.view.offset, offset)
  })

  return view
}

interface HydraCollectionParams {
  template: IriTemplate
  templateParams: GraphPointer
  observations: Record<string, Term>[]
  totalItems: number
  pageSize: number
}

function pageId({ offset, page, template, ...rest }: { template: IriTemplate; templateParams: GraphPointer; page?: number; offset?: number }) {
  const templateParams = clownface({
    dataset: $rdf.dataset([...rest.templateParams.dataset]),
    term: rest.templateParams.term,
  })

  if (page) {
    templateParams.deleteOut(hydra.pageIndex).addOut(hydra.pageIndex, page)
  } else if (offset) {
    const pageIndex = Number.parseInt(templateParams.out(hydra.pageIndex).value || '1')
    if (pageIndex === 1) {
      return undefined
    }

    templateParams.deleteOut(hydra.pageIndex).addOut(hydra.pageIndex, pageIndex + offset)
  }

  return $rdf.namedNode(new URL(template.expand(templateParams), env.API_CORE_BASE).toString())
}

export function createHydraCollection({ templateParams, template, observations, totalItems, pageSize }: HydraCollectionParams): Collection {
  const collectionId = template.expand(
    clownface({ dataset: $rdf.dataset() }).blankNode()
      .addOut(cc.cube, templateParams.out(cc.cube))
      .addOut(cc.cubeGraph, templateParams.out(cc.cubeGraph)),
  )

  const collectionPointer = clownface({ dataset: $rdf.dataset() })
    .namedNode(new URL(collectionId, env.API_CORE_BASE).toString())

  const lastPage = Math.ceil(totalItems / pageSize)

  return new CollectionMixin.Class(collectionPointer, {
    member: observations,
    totalItems,
    view: {
      types: [hydra.PartialCollectionView],
      id: pageId({ template, templateParams }),
      first: pageId({ template, templateParams, page: 1 }),
      next: pageId({ template, templateParams, offset: 1 }),
      previous: pageId({ template, templateParams, offset: -1 }),
      last: pageId({ template, templateParams, page: lastPage }),
    },
  }) as any
}
