import { ImportJob } from '@cube-creator/model/ImportJob'
import * as Models from '@cube-creator/model'
import { HydraClient } from 'alcaeus/alcaeus'
import { create } from './runner'
import { log } from '../log'

async function getJob(jobUri: string, Hydra: HydraClient): Promise<ImportJob> {
  const jobResource = await Hydra.loadResource<ImportJob>(jobUri)
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  return job
}

export default create({
  pipelineSources(): string[] {
    return ['import', 'to-graph-store', 'validate']
  },
  async prepare(options, variable) {
    const { job: jobUri } = options

    const Hydra = variable.get('apiClient')
    Hydra.resources.factory.addMixin(...Object.values(Models))

    const { dataset, dimensionMetadata, sourceCube, sourceGraph, sourceEndpoint, cubeGraph: { value: cubeGraph } } = await getJob(jobUri, Hydra)

    log('Importing cube %O', {
      sourceCube, sourceGraph, sourceEndpoint, cubeGraph, dimensionMetadata, dataset,
    })

    variable.set('sourceCube', sourceCube)
    variable.set('sourceEndpoint', sourceEndpoint)
    variable.set('sourceGraph', sourceGraph)
    variable.set('graph', cubeGraph)
    variable.set('metadataResource', dimensionMetadata.value)
    variable.set('datasetResource', dataset.value)
  },
})
