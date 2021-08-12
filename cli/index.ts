import program from 'commander'
import * as Sentry from '@sentry/node'
import '@sentry/tracing'
import { SpanStatusCode } from '@opentelemetry/api'
import { capture } from './lib/telemetry'
import './lib/variables'
import { logger } from './lib/log'
import { opentelemetry } from './lib/otel'
import { tracer } from './lib/otel/tracer'

function parseVariables(str: string, all: Map<string, string>) {
  return str
    .split(',')
    .reduce((vars, nameValue) => {
      const [name, value] = nameValue.split('=')

      return vars.set(name, value)
    }, all)
}

async function main() {
  const shutdownOtel = await opentelemetry()

  Sentry.init({
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    tracesSampleRate: 1.0,
  })

  const { transform, publish, importCube } = await import('./lib/commands')

  program
    .name('docker run --rm zazuko/cube-creator-cli')

  program
    .command('transform')
    .description('Transforms source files to RDF')
    .requiredOption('--to <targetName>', "(required) Target to write triples (built-in: 'stdout', 'filesystem', 'graph-store')")
    .requiredOption('--job <job>', '(required) URL of a Cube Creator project job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Transform', ({ job }) => ({ job }), transform))

  program
    .command('publish')
    .description('Publish cube to store')
    .requiredOption('--job <job>', '(required) URL of a Cube Creator publish job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Publish', ({ job }) => ({ job }), publish))

  program
    .command('import')
    .description('Import existing cube')
    .requiredOption('--job <job>', '(required) URL of a Cube Creator import job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Import', ({ job }) => ({ job }), importCube))

  return tracer.startActiveSpan('run', async span => {
    try {
      return await program.parseAsync(process.argv)
    } catch (err) {
      span.recordException(err)
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message })
      throw err
    } finally {
      span.end()
    }
  }).finally(shutdownOtel)
}

main()
  .catch(async e => {
    Sentry.captureException(e)
    logger.error(e)
    await Sentry.close(2000)
    process.exit(1)
  })
