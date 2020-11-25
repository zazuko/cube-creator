import { Collection, IriTemplate } from '@rdfine/hydra'
import { AnyPointer, GraphPointer } from 'clownface'
import { createSource, createView, createHydraCollection, populateFilters } from './lib'
import { DomainError } from '../../errors'

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

  const view = createView(cube)
  if (filters) {
    populateFilters(view, filters)
  }

  const observations = await view.observations()
  return createHydraCollection({
    observations: observations.slice(0, pageSize || DEFAULT_PAGE_SIZE),
    templateParams,
    template,
    totalItems: observations.length,
  })
}
