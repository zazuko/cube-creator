import { Collection, IriTemplate } from '@rdfine/hydra'
import { AnyPointer, GraphPointer } from 'clownface'
import { createSource, createView, createHydraCollection, populateFilters } from './lib'
import { DomainError } from '../../errors'
import { rdf } from '@tpluscode/rdf-ns-builders'
import * as ns from '@cube-creator/core/namespace'
import { loadResourceLabels } from '../queries/observations'
import { Quad, Term } from 'rdf-js'

const DEFAULT_PAGE_SIZE = 20

interface Params {
  cubeId: string
  sourceGraph: string
  templateParams: GraphPointer
  template: IriTemplate
  filters?: AnyPointer
  pageSize?: number
}

export async function getObservations({ cubeId, sourceGraph, filters, templateParams, template, pageSize }: Params): Promise<Collection> {
  const source = createSource(sourceGraph)

  const cubes = await source.cubes()
  const cube = cubes.find(({ ptr }) => ptr.value === cubeId)
  if (!cube) {
    throw new DomainError(`Cube not found: '${cubeId}'`)
  }

  const view = createView(cube, pageSize || DEFAULT_PAGE_SIZE)
  if (filters) {
    populateFilters(view, filters)
  }

  const observations = await view.observations()

  const collection = createHydraCollection({
    observations,
    templateParams,
    template,
    totalItems: 0,
  })

  // Load labels for linked resources
  const labelQuads = await getLabels(observations)
  labelQuads.forEach((quad) => collection.pointer.dataset.add(quad))

  return collection
}

async function getLabels (observations: Record<string, Term>[]): Promise<Quad[]> {
  const blackList = [rdf.type.value, ns.cube.observedBy.value]
  const resourceIds = new Set(observations.flatMap((observation) => {
    return Object.entries(observation)
      .filter(([key, value]) => !blackList.includes(key) && value.termType === 'NamedNode')
      .map(([, value]) => value)
  }))

  return loadResourceLabels([...resourceIds])
}
