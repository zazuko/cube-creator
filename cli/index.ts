import program from 'commander'
import debug from 'debug'
import * as Sentry from '@sentry/node'
import '@sentry/tracing'
import namespace from '@rdfjs/namespace'
import transform from './lib/commands/transform'

const log = debug('cube-creator')
log.enabled = false

const ns = {
  pipeline: namespace('urn:pipeline:cube-creator'),
}

const pipelines = {
  Entrypoint: ns.pipeline('#Main'),
}

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
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT,
    release: process.env.SENTRY_RELEASE,
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
    .requiredOption('--to <targetName>', "(required) Target to write triples (built-in: 'stdout', 'filesystem', 's3', 'graph-store')")
    .requiredOption('--job <job>', '(required) URL of a Cube Creator project job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(transform(pipelines.Entrypoint, log))

  program
    .command('publish')
    .description('publish cube to store')
    .requiredOption('--job <job>', '(required) URL of a Cube Creator project job')
    .option('--execution-url <executionUrl>', 'Link to job execution')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(transform(pipelines.Entrypoint, log))

  return program.parseAsync(process.argv)
}

main()
  .catch(e => {
    Sentry.captureException(e)
    log(e)
    process.exit(1)
  })
