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
import { Project, PublishJob } from '@cube-creator/model'
import assert from 'assert'
import polly from 'polly-js'
import temp from 'tempy'
import '../variables'
import '../hydra-cache'
import upload from '../upload'

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
    const { job: jobUri, debug = false, enableBufferMonitor = false, graphStore, executionUrl } = command

    log.enabled = debug
    const authConfig = {
      params: command.authParam,
    }

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = $rdf.dataset()
      .merge(await fileToDataset('text/turtle', pipelinePath('publish')))
      .merge(await fileToDataset('text/turtle', pipelinePath('to-filesystem')))

    setupAuthentication(authConfig, log)

    log('Running job %s', jobUri)

    const { job, namespace, cubeIdentifier } = await getJob(jobUri)

    variable.set('jobUri', jobUri)
    variable.set('executionUrl', executionUrl)
    variable.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variable.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variable.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)

    const targetFile = temp.file({ extension: '.nq' })
    log('Will write output to temp file %s', targetFile)
    variable.set('targetFile', targetFile)

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
      .then(() => {
        log.enabled = debug
      })
      .then(async () => {
        const endpoint = graphStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT!
        const username = graphStore?.user || process.env.PUBLISH_GRAPH_STORE_USER
        const password = graphStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD
        const graph = run.pipeline.context.variables.get('target-graph')
        assert(graph)

        log(`Uploading result to graph ${graph}`)

        await polly()
          .logger(log)
          .waitAndRetry(3)
          .executeForPromise(() => upload({
            method: 'post',
            pipeline: run.pipeline,
            endpoint,
            password,
            username,
            graph,
          }))

        log('Upload complete')
      })
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

  const projectResource = await Hydra.loadResource<Project>(job.project)
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

  return {
    job,
    namespace: datasetResource.representation?.root?.hasPart[0].id.value,
    cubeIdentifier: project.cubeIdentifier,
  }
}
