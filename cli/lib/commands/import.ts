import { ImportJob } from '@cube-creator/model/ImportJob'
import * as Models from '@cube-creator/model'
import { Hydra } from 'alcaeus/node'
import { create } from './runner'
import { log } from '../log'

Hydra.resources.factory.addMixin(...Object.values(Models))

async function getJob(jobUri: string): Promise<ImportJob> {
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
    const { sourceCube, sourceGraph, sourceEndpoint, cubeGraph: { value: cubeGraph } } = await getJob(jobUri)

    log('Importing cube %O', {
      sourceCube, sourceGraph, sourceEndpoint, cubeGraph,
    })

    variable.set('sourceCube', sourceCube)
    variable.set('sourceEndpoint', sourceEndpoint)
    variable.set('sourceGraph', sourceGraph)
    variable.set('graph', cubeGraph)
  },
})
