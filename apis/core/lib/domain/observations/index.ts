import { Quad, Term } from 'rdf-js'
import { Collection, IriTemplate } from '@rdfine/hydra'
import { AnyPointer, GraphPointer } from 'clownface'
import { rdf } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'
import { loadResourceLabels as _loadResourceLabels } from '../queries/observations'
import { warning } from '../../log'
import { createSource, createView, createHydraCollection, populateFilters } from './lib'

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_PAGE_INDEX = 1

interface Params {
  cubeId: string
  sourceGraph: string
  templateParams: GraphPointer
  template: IriTemplate
  filters?: AnyPointer
  pageSize?: number
  pageIndex?: number
  loadResourceLabels?: (ids: Term[]) => Promise<Quad[]>
}

export async function getObservations({
  cubeId,
  sourceGraph,
  filters,
  templateParams,
  template,
  pageSize = DEFAULT_PAGE_SIZE,
  pageIndex = DEFAULT_PAGE_INDEX,
  loadResourceLabels = _loadResourceLabels,
}: Params): Promise<Collection> {
  const source = createSource(sourceGraph)

  const cubes = await source.cubes()
  const cube = cubes.find(({ ptr }) => ptr.value === cubeId)
  if (!cube) {
    warning(`Cube not found: '${cubeId}'`)
    return createHydraCollection({
      observations: [],
      templateParams,
      template,
      totalItems: 0,
      pageSize,
    })
  }

  const offset = pageSize * (pageIndex - 1)
  const view = createView(cube, pageSize, offset)
  if (filters) {
    populateFilters(view, filters)
  }

  // Since we have no filters and are always querying all dimensions,
  // we can always omit the `distinct`, which should make the query faster
  const observations = await view.observations({ disableDistinct: true })
  const totalItems = await view.observationCount({ disableDistinct: true })

  const collection = createHydraCollection({
    observations,
    templateParams,
    template,
    totalItems,
    pageSize,
  })

  // Load labels for linked resources
  const labelQuads = await getLabels(observations, loadResourceLabels)
  labelQuads.forEach((quad) => collection.pointer.dataset.add(quad))

  return collection
}

async function getLabels(observations: Record<string, Term>[], loadResourceLabels: (ids: Term[]) => Promise<Quad[]>): Promise<Quad[]> {
  const blackList: string[] = [rdf.type.value, ns.cube.observedBy.value]
  const resourceIds = new Set(observations.flatMap((observation) => {
    return Object.entries(observation)
      .filter(([key, value]) => !blackList.includes(key) && value.termType === 'NamedNode')
      .map(([, value]) => value)
  }))

  return loadResourceLabels([...resourceIds])
}
