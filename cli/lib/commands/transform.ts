import { Command } from 'commander'
import path from 'path'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { fileToDataset } from 'barnard59'
import { Debugger } from 'debug'
import { AuthConfig, setupAuthentication } from '../auth'
import Runner from 'barnard59/lib/runner'
import bufferDebug from 'barnard59/lib/bufferDebug'

interface RunOptions extends Command {
  debug: boolean
  to: string
  project: string
  variable: Map<string, string>
  enableBufferMonitor: boolean
  authParam: Map<string, string>
}

export default function (pipelineId: NamedNode, basePath: string, log: Debugger) {
  return async function (command: RunOptions) {
    const { to, project, debug, enableBufferMonitor } = command

    log.enabled = debug

    if (command.authIssuer) {
      const authConfig: AuthConfig = {
        issuer: command.authIssuer,
        clientId: command.authClientId,
        clientSecret: command.authClientSecret,
        params: command.authParam,
      }

      setupAuthentication(authConfig, log)
    }

    const pipelinePath = (filename: string) => path.join(basePath, `./pipelines/${filename}.ttl`)
    const dataset = $rdf.dataset()
      .merge(await fileToDataset('text/turtle', pipelinePath('main')))
      .merge(await fileToDataset('text/turtle', pipelinePath('from-api')))
      .merge(await fileToDataset('text/turtle', pipelinePath(`to-${to}`)))

    const run = Runner.create({
      basePath: path.resolve(basePath, 'pipelines'),
      outputStream: process.stdout,
      term: pipelineId.value,
      dataset,
    })

    Runner.log.enabled = debug

    log('Running project %s', project)

    if (enableBufferMonitor) {
      bufferDebug(run.pipeline)
    }

    return run.promise
  }
}
