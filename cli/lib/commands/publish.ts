import path from 'path'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { fileToDataset } from 'barnard59'
import { Debugger } from 'debug'
import { setupAuthentication } from '../auth'
import Runner from 'barnard59/lib/runner'
import bufferDebug from 'barnard59/lib/bufferDebug'
import clownface from 'clownface'
import namespace from '@rdfjs/namespace'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { names } from '../variables'
import { updateJobStatus } from '../job'
import { Hydra } from 'alcaeus/node'
import { Project, PublishJob } from '@cube-creator/model'

const ns = {
  pipelines: namespace('https://pipeline.described.at/'),
}

interface RunOptions {
  debug: boolean
  job: string
  executionUrl?: string
  variable?: Map<string, string | undefined>
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

  return async function (command: RunOptions) {
    const { job: jobUri, debug = false, enableBufferMonitor = false, variable = new Map(), graphStore, publishStore, executionUrl } = command

    log.enabled = debug
    const authConfig = {
      params: command.authParam,
    }

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = $rdf.dataset()
      .merge(await fileToDataset('text/turtle', pipelinePath('publish')))

    setupAuthentication(authConfig, log)

    log('Running job %s', jobUri)

    const [job, namespace] = await getJob(jobUri)

    const pipeline = clownface({ dataset }).namedNode(pipelineId)
    variable.set('jobUri', jobUri)
    variable.set(names.executionUrl, executionUrl)
    variable.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variable.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variable.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)
    variable.set('publish-graph-store-endpoint', publishStore?.endpoint || process.env.PUBLISH_GRAPH_STORE_ENDPOINT)
    variable.set('publish-graph-store-user', publishStore?.user || process.env.PUBLISH_GRAPH_STORE_USER)
    variable.set('publish-graph-store-password', publishStore?.password || process.env.PUBLISH_GRAPH_STORE_PASSWORD)
    variable.set('target-graph', process.env.PUBLISH_GRAPH_OVERRIDE || job.publishGraph)
    variable.set('revision', job.revision)
    variable.set('namespace', namespace)

    const timestamp = new Date()
    variable.set('timestamp', timestamp.toISOString())

    pipeline.addOut(ns.pipelines.variables, set => {
      variable.forEach((value, key) => {
        if (!value) return

        set.addOut(ns.pipelines.variable, variable => {
          variable.addOut(rdf.type, ns.pipelines.Variable)
            .addOut(ns.pipelines('name'), key)
            .addOut(ns.pipelines.value, value)
        })
      })
    })

    const run = Runner.create({
      basePath: path.resolve(basePath, 'pipelines'),
      outputStream: process.stdout,
      term: pipelineId.value,
      dataset,
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
          jobUri: run.pipeline.context.variables.get(names.jobUri),
          executionUrl: run.pipeline.context.variables.get(names.executionUrl),
          status: schema.CompletedActionStatus,
        }))
      .catch(async (error) => {
        await updateJobStatus({
          log: run.pipeline.context.log,
          modified: timestamp,
          jobUri: run.pipeline.context.variables.get(names.jobUri),
          executionUrl: run.pipeline.context.variables.get(names.executionUrl),
          status: schema.FailedActionStatus,
          error,
        })

        throw error
      })
  }
}

async function getJob(jobUri: string): Promise<[PublishJob, string]> {
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

  return [job, datasetResource.representation?.root?.hasPart[0].id.value]
}
