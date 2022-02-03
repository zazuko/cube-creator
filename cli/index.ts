import program from 'commander'
import * as Sentry from '@sentry/node'
import '@sentry/tracing'
import { SpanStatusCode } from '@opentelemetry/api'
import { capture } from './lib/telemetry'
import './lib/variables'
import { opentelemetry } from './lib/otel'

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

  const { logger } = await import('./lib/log')
  const { tracer } = await import('./lib/otel/tracer')
  const { transform, publish, unlist, importCube, timeoutJobs } = await import('./lib/commands')

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
    .requiredOption('--to <targetName>', "(required) Target to write triples (built-in: 'filesystem', 'graph-store')")
    .requiredOption('--job <job>', '(required) URL of a Cube Creator publish job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--no-upload', 'When used together with --to filesystem, will prevent writing to store')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Publish', ({ job }) => ({ job }), publish))

  program
    .command('unlist')
    .description('Unlist all versions of published cube')
    .requiredOption('--job <job>', '(required) URL of a Cube Creator unlist job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Unlist', ({ job }) => ({ job }), unlist))

  program
    .command('timeout-jobs')
    .description('Fails jobs which have been active for an excessive amount of time')
    .option('--duration <duration>', 'ISO8601 duration', 'PT6H')
    .action(capture('Timeout', () => ({ }), timeoutJobs))

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
      Sentry.captureException(err)
      logger.error(err)
      throw err
    } finally {
      span.end()
    }
  }).finally(async () => {
    await Sentry.close(2000)
    await shutdownOtel()
  })
}

main()
  .catch(async (err) => {
    const { logger } = await import('./lib/log')
    logger.error(err)
    process.exit(1)
  })
