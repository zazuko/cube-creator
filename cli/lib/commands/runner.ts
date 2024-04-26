import path from 'path'
import $rdf from '@cube-creator/env'
import { fromFile } from '@zazuko/rdf-utils-fs'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import type { VariableMap } from 'barnard59-core'
import { cc } from '@cube-creator/core/namespace'
import { setupAuthentication } from '../auth.js'
import { updateJobStatus } from '../job.js'
import { logger } from '../log.js'
import bufferDebug from '../bufferDebug.js'

const ns = {
  pipeline: $rdf.namespace('urn:pipeline:cube-creator'),
}

const pipelines = {
  Entrypoint: ns.pipeline('#Main'),
}

export interface RunOptions {
  debug: boolean
  job: string
  executionUrl?: string
  variable?: VariableMap
  noStatusUpdate?: boolean
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

  /**
   * Optional hook called after the pipeline has finished
   */
  after?(options: TOptions, variables: VariableMap): Promise<void> | void
}

async function fileToDataset(filename: string) {
  return $rdf.dataset().import(fromFile($rdf, filename))
}

export function create<TOptions extends RunOptions>({ pipelineSources, prepare, after }: Create<TOptions>) {
  const basePath = path.resolve(__dirname, '../../')

  return async function (command: TOptions) {
    const { variable: variables = new Map(), job: jobUri, debug = false, graphStore, executionUrl } = command
    const shouldUpdateJobStatus = !command.noStatusUpdate

    const authConfig = {
      params: command.authParam,
    }

    $rdf.hydra.cacheStrategy.shouldLoad = previous => {
      if (previous.representation?.root?.types.has(cc.CSVSource)) {
        return true
      }

      return false
    }
    setupAuthentication(authConfig, logger)

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = await pipelineSources(command).reduce((previous, source) => {
      return Promise.resolve().then(async () => {
        const dataset = await previous
        return dataset.merge(await fileToDataset(pipelinePath(source)))
      })
    }, Promise.resolve($rdf.dataset()))

    logger.info('Running job %s', jobUri)
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

    const { default: Runner } = await import('barnard59/runner.js')
    const run = await Runner($rdf.clownface({
      dataset,
      term: pipelines.Entrypoint,
    }), $rdf, {
      basePath: path.resolve(basePath, 'pipelines'),
      outputStream: process.stdout,
      variables,
      level: debug ? 'debug' : 'error',
    })

    bufferDebug(run.pipeline, jobUri, { interval: 100 })

    if (shouldUpdateJobStatus) {
      await updateJobStatus({
        jobUri,
        modified: new Date(),
        executionUrl: variables.get('executionUrl'),
        status: schema.ActiveActionStatus,
      })
    }

    async function jobFailed(error: Error) {
      if (shouldUpdateJobStatus) {
        await updateJobStatus({
          modified: timestamp,
          jobUri: run.pipeline.context.variables.get('jobUri'),
          executionUrl: run.pipeline.context.variables.get('executionUrl'),
          lastTransformed: run.pipeline.context.variables.get('lastTransformed'),
          status: schema.FailedActionStatus,
          error,
        })
      }

      throw error
    }

    process.once('unhandledRejection' as any, jobFailed)

    return run.finished
      .then(async () => {
        await after?.(command, variables)
        if (shouldUpdateJobStatus) {
          await updateJobStatus({
            modified: timestamp,
            jobUri: run.pipeline.context.variables.get('jobUri'),
            executionUrl: run.pipeline.context.variables.get('executionUrl'),
            status: schema.CompletedActionStatus,
            messages: run.pipeline.context.variables.get('messages'),
          })
        }
      })
      .catch(jobFailed)
  }
}
