import path from 'path'
import $rdf from 'rdf-ext'
import { fileToDataset } from 'barnard59'
import { setupAuthentication } from '../auth'
import Runner from 'barnard59/lib/runner'
import bufferDebug from 'barnard59/lib/bufferDebug'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import type { Variables } from 'barnard59-core/lib/Pipeline'
import namespace from '@rdfjs/namespace'
import { updateJobStatus } from '../job'
import '../hydra-cache'
import { log } from '../log'

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
  variable?: Variables
  graphStore?: {
    endpoint: string
    user: string
    password: string
  }
  enableBufferMonitor?: boolean
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
  prepare?(options: TOptions, variable: Variables): Promise<void> | void
}

export function create<TOptions extends RunOptions>({ pipelineSources, prepare }: Create<TOptions>) {
  const basePath = path.resolve(__dirname, '../../')

  return async function (command: TOptions) {
    const { variable = new Map(), job: jobUri, debug = false, enableBufferMonitor = false, graphStore, executionUrl } = command

    log.enabled = debug

    const authConfig = {
      params: command.authParam,
    }
    setupAuthentication(authConfig, log)

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = await pipelineSources(command).reduce((previous, source) => {
      return Promise.resolve().then(async () => {
        const dataset = await previous
        return dataset.merge(await fileToDataset('text/turtle', pipelinePath(source)))
      })
    }, Promise.resolve($rdf.dataset()))

    log('Running job %s', jobUri)
    variable.set('jobUri', jobUri)
    variable.set('executionUrl', executionUrl)
    variable.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variable.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variable.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)

    const timestamp = new Date()
    variable.set('timestamp', $rdf.literal(timestamp.toISOString(), xsd.dateTime))

    await prepare?.(command, variable)

    const run = Runner.create({
      basePath: path.resolve(basePath, 'pipelines'),
      outputStream: process.stdout,
      term: pipelines.Entrypoint.value,
      dataset,
      variable,
    })

    Runner.log.enabled = debug

    if (enableBufferMonitor) {
      bufferDebug(run.pipeline)
    }

    await updateJobStatus({
      jobUri,
      modified: new Date(),
      executionUrl: variable.get('executionUrl'),
      status: schema.ActiveActionStatus,
    })

    return run.promise
      .then(() =>
        updateJobStatus({
          modified: timestamp,
          jobUri: run.pipeline.context.variables.get('jobUri'),
          executionUrl: run.pipeline.context.variables.get('executionUrl'),
          status: schema.CompletedActionStatus,
        }))
      .catch(async (error) => {
        await updateJobStatus({
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
