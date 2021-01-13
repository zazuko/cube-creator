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

interface RunOptions {
  debug: boolean
  to: 'stdout' | 'filesystem' | 'graph-store'
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

export default function (pipelineId: NamedNode, log: Debugger) {
  const basePath = path.resolve(__dirname, '../../')

  return async function ({ variable = new Map(), ...command }: RunOptions) {
    const { to, job, debug = false, enableBufferMonitor = false, graphStore, executionUrl } = command

    log.enabled = debug

    const authConfig = {
      params: command.authParam,
    }
    setupAuthentication(authConfig, log)

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = $rdf.dataset()
      .merge(await fileToDataset('text/turtle', pipelinePath('main')))
      .merge(await fileToDataset('text/turtle', pipelinePath('from-api')))
      .merge(await fileToDataset('text/turtle', pipelinePath(`to-${to}`)))

    log('Running job %s', job)
    variable.set('jobUri', job)
    variable.set('executionUrl', executionUrl)
    variable.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variable.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variable.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)

    const timestamp = new Date()
    variable.set('timestamp', $rdf.literal(timestamp.toISOString(), xsd.dateTime))

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
