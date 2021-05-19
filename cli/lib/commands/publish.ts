import { HydraClient } from 'alcaeus/alcaeus'
import { CsvProject, ImportProject, PublishJob } from '@cube-creator/model'
import '../variables'
import { isCsvProject } from '@cube-creator/model/Project'
import TermSet from '@rdfjs/term-set'
import * as runner from './runner'
import { log } from '../log'

interface PublishRunOptions extends runner.RunOptions {
  publishStore?: {
    endpoint: string
    user: string
    password: string
  }
}

export default runner.create<PublishRunOptions>({
  pipelineSources() {
    return ['publish']
  },
  async prepare(options, variable) {
    const { publishStore, job: jobUri } = options
    const Hydra = variable.get('apiClient')

    const { job, namespace, cubeIdentifier } = await getJob(jobUri, Hydra)

    variable.set('publish-graph-store-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT)
    variable.set('publish-graph-query-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_QUERY_ENDPOINT)
    variable.set('publish-graph-store-user', publishStore?.user || process.env.PUBLISH_GRAPH_STORE_USER)
    variable.set('publish-graph-store-password', publishStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD)
    variable.set('versionedDimensions', new TermSet())

    variable.set('target-graph', job.publishGraph.value)
    if (process.env.PUBLISH_GRAPH_OVERRIDE) {
      log('Overriding target graph from PUBLISH_GRAPH_OVERRIDE')
      variable.set('target-graph', process.env.PUBLISH_GRAPH_OVERRIDE)
    }
    log(`Publishing to graph <${variable.get('target-graph')}>`)

    variable.set('revision', job.revision)
    variable.set('namespace', namespace)
    variable.set('cubeIdentifier', cubeIdentifier)
    log(`Publishing cube <${cubeIdentifier}>`)
  },
})

async function getJob(jobUri: string, Hydra: HydraClient): Promise<{
  job: PublishJob
  namespace: string
  cubeIdentifier: string
}> {
  const jobResource = await Hydra.loadResource<PublishJob>(jobUri)
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
