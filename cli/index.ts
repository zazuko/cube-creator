import program from 'commander'
import * as Sentry from '@sentry/node'
import '@sentry/tracing'
import { transform, publish, unlist, importCube, timeoutJobs } from './lib/commands'
import { capture } from './lib/telemetry'
import './lib/variables'
import { log } from './lib/log'

function parseVariables(str: string, all: Map<string, string>) {
  return str
    .split(',')
    .reduce((vars, nameValue) => {
      const [name, value] = nameValue.split('=')

      return vars.set(name, value)
    }, all)
}

async function main() {
  Sentry.init({
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    tracesSampleRate: 1.0,
  })

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
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Transform', ({ job }) => ({ job }), transform))

  program
    .command('publish')
    .description('Publish cube to store')
    .requiredOption('--job <job>', '(required) URL of a Cube Creator publish job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
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
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(capture('Import', ({ job }) => ({ job }), importCube))

  return program.parseAsync(process.argv)
}

main()
  .catch(async e => {
    Sentry.captureException(e)
    log(e)
    await Sentry.close(2000)
    process.exit(1)
  })
