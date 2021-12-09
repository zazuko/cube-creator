import path from 'path'
import clownface from 'clownface'
import $rdf from 'rdf-ext'
import fromFile from 'rdf-utils-fs/fromFile.js'
import { setupAuthentication } from '../auth'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import type { VariableMap } from 'barnard59-core'
import namespace from '@rdfjs/namespace'
import * as Alcaeus from 'alcaeus/node'
import { cc } from '@cube-creator/core/namespace'
import * as Models from '@cube-creator/model'
import { updateJobStatus } from '../job'
import { logger } from '../log'
import { importDynamic } from '../module'
import bufferDebug from '../bufferDebug'

const ns = {
  pipeline: namespace('urn:pipeline:cube-creator'),
}

const pipelines = {
  Entrypoint: ns.pipeline('#Main'),
}

export interface RunOptions {
  debug: boolean
  job: string
  executionUrl?: string
  variable?: VariableMap
  graphStore?: {
    endpoint: string
    user: string
    password: string
  }
  authParam?: Map<string, string>
}

interface Create<TOptions> {
  /**
   * Get the names of files located in /pipelines directory to load into the pipeline graph
   */
  pipelineSources(options: TOptions): string[]

  /**
   * Set any additional pipeline variables here
   */
  prepare?(options: TOptions, variable: VariableMap): Promise<void> | void
}

async function fileToDataset(filename: string) {
  return $rdf.dataset().import(fromFile(filename))
}

export function create<TOptions extends RunOptions>({ pipelineSources, prepare }: Create<TOptions>) {
  const basePath = path.resolve(__dirname, '../../')

  return async function (command: TOptions) {
    const { variable: variables = new Map(), job: jobUri, debug = false, graphStore, executionUrl } = command

    const authConfig = {
      params: command.authParam,
    }

    const apiClient = Alcaeus.create()
    apiClient.resources.factory.addMixin(...Object.values(Models))
    apiClient.cacheStrategy.shouldLoad = previous => {
      if (previous.representation?.root?.types.has(cc.CSVSource)) {
        return true
      }

      return false
    }
    setupAuthentication(authConfig, logger, apiClient)

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = await pipelineSources(command).reduce((previous, source) => {
      return Promise.resolve().then(async () => {
        const dataset = await previous
        return dataset.merge(await fileToDataset(pipelinePath(source)))
      })
    }, Promise.resolve($rdf.dataset()))

    logger.info('Running job %s', jobUri)
    variables.set('apiClient', apiClient)
    variables.set('jobUri', jobUri)
    variables.set('executionUrl', executionUrl)
    variables.set('graph-query-endpoint', process.env.GRAPH_QUERY_ENDPOINT)
    variables.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variables.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variables.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)
    variables.set('messages', [])

    const timestamp = new Date()
    variables.set('timestamp', $rdf.literal(timestamp.toISOString(), xsd.dateTime))

    await prepare?.(command, variables)

    const { default: Runner } = await importDynamic('barnard59/runner.js')
    const run = await Runner(clownface({
      dataset,
      term: pipelines.Entrypoint,
    }), {
      basePath: path.resolve(basePath, 'pipelines'),
      outputStream: process.stdout,
      variables,
      level: debug ? 'debug' : 'error',
    })

    bufferDebug(run.pipeline, jobUri, { interval: 100 })

    await updateJobStatus({
      jobUri,
      modified: new Date(),
      executionUrl: variables.get('executionUrl'),
      status: schema.ActiveActionStatus,
      apiClient,
    })

    async function jobFailed(error: Error) {
      await updateJobStatus({
        modified: timestamp,
        jobUri: run.pipeline.context.variables.get('jobUri'),
        executionUrl: run.pipeline.context.variables.get('executionUrl'),
        lastTransformed: run.pipeline.context.variables.get('lastTransformed'),
        status: schema.FailedActionStatus,
        error,
        apiClient,
      })

      throw error
    }

    process.once('unhandledRejection' as any, jobFailed)

    return run.finished
      .then(() =>
        updateJobStatus({
          modified: timestamp,
          jobUri: run.pipeline.context.variables.get('jobUri'),
          executionUrl: run.pipeline.context.variables.get('executionUrl'),
          status: schema.CompletedActionStatus,
          apiClient,
          messages: run.pipeline.context.variables.get('messages'),
        }))
      .catch(jobFailed)
  }
}
