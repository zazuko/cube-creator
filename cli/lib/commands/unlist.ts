import { HydraClient } from 'alcaeus/alcaeus'
import { CsvProject, ImportProject, UnlistJob } from '@cube-creator/model'
import '../variables'
import { isCsvProject } from '@cube-creator/model/Project'
import { logger } from '../log'
import * as runner from './runner'

interface UnlistRunOptions extends runner.RunOptions {
  publishStore?: {
    endpoint: string
    user: string
    password: string
  }
}

export default runner.create<UnlistRunOptions>({
  pipelineSources() {
    return ['unlist']
  },
  async prepare(options, variable) {
    const { publishStore, job: jobUri } = options
    const Hydra = variable.get('apiClient')

    const { job, namespace, cubeIdentifier } = await getJob(jobUri, Hydra)

    variable.set('unlist-job', job)
    variable.set('publish-graph-store-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT)
    variable.set('publish-graph-query-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_QUERY_ENDPOINT)
    variable.set('publish-graph-store-user', publishStore?.user || process.env.PUBLISH_GRAPH_STORE_USER)
    variable.set('publish-graph-store-password', publishStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD)

    variable.set('target-graph', job.publishGraph.value)
    if (process.env.PUBLISH_GRAPH_OVERRIDE) {
      logger.info('Overriding target graph from PUBLISH_GRAPH_OVERRIDE')
      variable.set('target-graph', process.env.PUBLISH_GRAPH_OVERRIDE)
    }
    logger.info(`Unlisting from graph <${variable.get('target-graph')}>`)

    variable.set('namespace', namespace)
    variable.set('cubeIdentifier', cubeIdentifier)
    logger.info(`Unlisting cube <${cubeIdentifier}>`)
  },
})

async function getJob(jobUri: string, Hydra: HydraClient): Promise<{
  job: UnlistJob
  namespace: string
  cubeIdentifier: string
}> {
  const jobResource = await Hydra.loadResource<UnlistJob>(jobUri)
  const job = jobResource.representation?.root
  if (!job) {
    throw new Error(`Did not find representation of job ${jobUri}. Server responded ${jobResource.response?.xhr.status}`)
  }

  const projectResource = await Hydra.loadResource<CsvProject | ImportProject>(job.project)
  const project = projectResource.representation?.root
  if (!project) {
    throw new Error(`Did not find representation of project ${job.project}. Server responded ${projectResource.response?.xhr.status}`)
  }

  if (!project.dataset.load) {
    throw new Error(`Can not load dataset ${project.dataset}`)
  }
  const datasetResource = await project.dataset.load()
  if (!datasetResource.representation?.root?.hasPart[0]) {
    throw new Error(`Can not determine target graph for job ${jobUri}`)
  }

  const cubeIdentifier = isCsvProject(project) ? project.cubeIdentifier : project.sourceCube.value

  return {
    job,
    namespace: datasetResource.representation?.root?.hasPart[0].id.value,
    cubeIdentifier,
  }
}
