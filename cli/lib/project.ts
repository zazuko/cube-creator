import { PublishJob, Project } from '@cube-creator/model'
import type { Context } from 'barnard59-core'
import { CCEnv } from '@cube-creator/env'
import { tracer } from './otel/tracer.js'

export async function loadProject(jobUri: string, { logger, env }: Context<CCEnv>) {
  return tracer.startActiveSpan('find project', { attributes: { jobUri } }, async span => {
    try {
      const jobResource = await env.hydra.loadResource<PublishJob>(jobUri)
      const job = jobResource.representation?.root
      if (!job) {
        throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
      }

      const projectResource = await env.hydra.loadResource<Project>(job.project)
      const project = projectResource.representation?.root
      if (!project) {
        throw new Error(`Did not find representation of project ${job.project}. Server responded ${projectResource.response?.xhr.status}`)
      }

      logger.info(`Source graph <${project.cubeGraph.value}>`)

      return { project, job }
    } finally {
      span.end()
    }
  })
}
