import { PublishJob, Project } from '@cube-creator/model'
import type { Context } from 'barnard59-core/lib/Pipeline'
import { tracer } from './otel/tracer'

export async function loadProject(jobUri: string, { variables, logger }: Context) {
  return tracer.startActiveSpan('find project', { attributes: { jobUri } }, async span => {
    try {
      const Hydra = variables.get('apiClient')

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

      logger.info(`Source graph <${project.cubeGraph.value}>`)

      return project
    } finally {
      span.end()
    }
  })
}
