import { ImportJob } from '@cube-creator/model/ImportJob'
import * as Models from '@cube-creator/model'
import { Hydra } from 'alcaeus/node'
import { create } from './runner'

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
  async setVariables(options, variable) {
    const { job: jobUri } = options
    const job = await getJob(jobUri)

    variable.set('sourceCube', job.sourceCube)
    variable.set('sourceEndpoint', job.sourceEndpoint)
    variable.set('sourceGraph', job.sourceGraph)
    variable.set('graph', job.cubeGraph.value)
  },
})
