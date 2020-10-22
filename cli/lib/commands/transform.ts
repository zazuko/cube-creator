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
import { rdf } from '@tpluscode/rdf-ns-builders'

const ns = {
  pipelines: namespace('https://pipeline.described.at/'),
}

interface RunOptions {
  debug: boolean
  to: string
  project: string
  variable: Map<string, string>
  enableBufferMonitor: boolean
  authParam: Map<string, string>
}

export default function (pipelineId: NamedNode, log: Debugger) {
  const basePath = path.resolve(__dirname, '../../')

  return async function (command: RunOptions) {
    const { to, project, debug, enableBufferMonitor, variable } = command

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

    log('Running project %s', project)
    const pipeline = clownface({ dataset }).namedNode(pipelineId)
    variable.set('projectUri', project)

    pipeline.addOut(ns.pipelines.variables, set => {
      variable.forEach((value, key) => {
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
  }
}
