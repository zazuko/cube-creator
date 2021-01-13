
import type Pipeline from 'barnard59-core/lib/Pipeline'
import { PublishJob, Project } from '@cube-creator/model'
import { Hydra } from 'alcaeus/node'
import { get } from 'barnard59-graph-store'
import { Stream } from 'readable-stream'
import * as Models from '@cube-creator/model'

Hydra.resources.factory.addMixin(...Object.values(Models))

interface Params {
  jobUri: string
  endpoint: string
  user: string
  password: string
}

export async function loadCube(this: Pipeline.Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const jobResource = await Hydra.loadResource<PublishJob>(jobUri)
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  const projectResource = await Hydra.loadResource<Project>(job.project)
  const project = projectResource.representation?.root
  if (!project) {
    throw new Error(`Did not find representation of project ${job.project}. Server responded ${projectResource.response?.xhr.status}`)
  }

  this.log.info(`Source graph <${project.cubeGraph.value}>`)

  return get({ endpoint, graph: project.cubeGraph.value, user, password })
}
