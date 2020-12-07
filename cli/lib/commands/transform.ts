import path from 'path'
import * as Sentry from '@sentry/node'
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

const ns = {
  pipelines: namespace('https://pipeline.described.at/'),
}

interface RunOptions {
  debug: boolean
  to: 'stdout' | 'filesystem' | 'graph-store'
  job: string
  executionUrl?: string
  variable?: Map<string, string | undefined>
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

  return async function (command: RunOptions) {
    const { to, job, debug = false, enableBufferMonitor = false, variable = new Map(), graphStore, executionUrl } = command

    const transaction = Sentry.startTransaction({
      op: 'transform',
      name: 'Transform',
      data: {
        job,
      },
    })

    Sentry.configureScope(scope => scope.setSpan(transaction))

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
    const pipeline = clownface({ dataset }).namedNode(pipelineId)
    variable.set('jobUri', job)
    variable.set(names.executionUrl, executionUrl)
    variable.set('graph-store-endpoint', graphStore?.endpoint || process.env.GRAPH_STORE_ENDPOINT)
    variable.set('graph-store-user', graphStore?.user || process.env.GRAPH_STORE_USER)
    variable.set('graph-store-password', graphStore?.password || process.env.GRAPH_STORE_PASSWORD)

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
          jobUri: run.pipeline.context.variables.get(names.jobUri),
          executionUrl: run.pipeline.context.variables.get(names.executionUrl),
          status: schema.CompletedActionStatus,
        }))
      .catch(async (error) => {
        await updateJobStatus({
          log: run.pipeline.context.log,
          jobUri: run.pipeline.context.variables.get(names.jobUri),
          executionUrl: run.pipeline.context.variables.get(names.executionUrl),
          status: schema.FailedActionStatus,
          error,
        })

        throw error
      })
      .finally(() => transaction.finish())
  }
}
