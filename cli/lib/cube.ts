import rdf from 'rdf-ext'
import { DatasetCore } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'

export const getObservationSetId = ({ dataset }: { dataset: DatasetCore }) => {
  const cubeId = [...dataset.match(null, cc.cube)][0].object.value

  if (cubeId.endsWith('/') || cubeId.endsWith('#')) {
    return rdf.namedNode(`${cubeId}observation/`)
  }

  return rdf.namedNode(`${cubeId}/observation/`)
}
