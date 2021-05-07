import path from 'path'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { fileToDataset } from 'barnard59'
import { Debugger } from 'debug'
import { setupAuthentication } from '../auth'
import Runner from 'barnard59/lib/runner'
import bufferDebug from 'barnard59/lib/bufferDebug'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import type { Variables } from 'barnard59-core/lib/Pipeline'
import { updateJobStatus } from '../job'
import { Hydra } from 'alcaeus/node'
import { CsvProject, ImportProject, PublishJob } from '@cube-creator/model'
import '../variables'
import '../hydra-cache'
import { isCsvProject } from '../../../apis/core/lib/domain/cube-projects/Project'

interface RunOptions {
  debug: boolean
  job: string
  executionUrl?: string
  variable?: Variables
  graphStore?: {
    endpoint: string
    user: string
    password: string
  }
  publishStore?: {
    endpoint: string
    user: string
    password: string
  }
  enableBufferMonitor?: boolean
  authParam?: Map<string, string>
}

export default function (pipelineId: NamedNode, log: Debugger) {
  const basePath = path.resolve(__dirname, '../../')

  return async function ({ variable = new Map(), ...command }: RunOptions) {
    const { job: jobUri, debug = false, enableBufferMonitor = false, graphStore, publishStore, executionUrl } = command

    log.enabled = debug
    const authConfig = {
      params: command.authParam,
    }

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = $rdf.dataset()
      .merge(await fileToDataset('text/turtle', pipelinePath('publish')))

    setupAuthentication(authConfig, log)

    log('Running job %s', jobUri)

    const { job, namespace, cubeIdentifier } = await getJob(jobUri)

    variable.set('jobUri', jobUri)
    variable.set('executionUrl', executionUrl)
    variable.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variable.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variable.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)
    variable.set('publish-graph-store-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT)
    variable.set('publish-graph-store-user', publishStore?.user || process.env.PUBLISH_GRAPH_STORE_USER)
    variable.set('publish-graph-store-password', publishStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD)

    const timestamp = new Date()
    variable.set('timestamp', $rdf.literal(timestamp.toISOString(), xsd.dateTime))

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

    const run = Runner.create({
      basePath: path.resolve(basePath, 'pipelines'),
      outputStream: process.stdout,
      term: pipelineId.value,
      dataset,
      variable,
    })

    Runner.log.enabled = debug

    if (enableBufferMonitor) {
      bufferDebug(run.pipeline)
    }

    return run.promise
      .then(() =>
        updateJobStatus({
          log: run.pipeline.context.log,
          modified: timestamp,
          jobUri: run.pipeline.context.variables.get('jobUri'),
          executionUrl: run.pipeline.context.variables.get('executionUrl'),
          status: schema.CompletedActionStatus,
        }))
      .catch(async (error) => {
        await updateJobStatus({
          log: run.pipeline.context.log,
          modified: timestamp,
          jobUri: run.pipeline.context.variables.get('jobUri'),
          executionUrl: run.pipeline.context.variables.get('executionUrl'),
          status: schema.FailedActionStatus,
          error,
        })

        throw error
      })
  }
}

async function getJob(jobUri: string): Promise<{
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

  const cubeIdentifier = isCsvProject(project) ? project.cubeIdentifier : project.importCube.value

  return {
    job,
    namespace: datasetResource.representation?.root?.hasPart[0].id.value,
    cubeIdentifier,
  }
}
