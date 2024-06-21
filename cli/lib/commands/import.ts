import { ImportJob } from '@cube-creator/model/ImportJob'
import { HydraClient } from 'alcaeus/alcaeus'
import $rdf from '@cube-creator/env'
import { logger } from '../log.js'
import { create } from './runner.js'

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

    const { dataset, dimensionMetadata, sourceCube, sourceGraph, sourceEndpoint, cubeGraph: { value: cubeGraph } } = await getJob(jobUri, $rdf.hydra)

    logger.info('Importing cube %O', {
      sourceCube, sourceGraph, sourceEndpoint, cubeGraph, dimensionMetadata: dimensionMetadata.id, dataset,
    })

    variable.set('sourceCube', sourceCube)
    variable.set('sourceEndpoint', sourceEndpoint)
    variable.set('sourceGraph', sourceGraph)
    variable.set('graph', cubeGraph)
    variable.set('metadataResource', dimensionMetadata.id.value)
    variable.set('datasetResource', dataset.value)
  },
})
