import type Pipeline from 'barnard59-core/lib/Pipeline'
import { PublishJob, Project } from '@cube-creator/model'
import { Stream } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { tracer } from './otel/tracer'

interface Params {
  jobUri: string
  endpoint: string
  user: string
  password: string
}

export async function loadCube(this: Pipeline.Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const project = await tracer.startActiveSpan('find project', { attributes: { jobUri } }, async span => {
    try {
      const Hydra = this.variables.get('apiClient')

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

      this.logger.info(`Source graph <${project.cubeGraph.value}>`)

      return project
    } finally {
      span.end()
    }
  })

  const query = CONSTRUCT`?s ?p ?o`
    .FROM(project.cubeGraph)
    .WHERE`
      ?s ?p ?o
      filter (?p != ${csvw.describes})
    `

  return query.execute(new StreamClient({
    endpointUrl: endpoint,
    user,
    password,
  }).query)
}
