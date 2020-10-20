import program from 'commander'
import debug from 'debug'
import namespace from '@rdfjs/namespace'
import transform from './lib/commands/transform'

const log = debug('cube-creator')
log.enabled = false

const ns = {
  pipeline: namespace('urn:pipeline:data-cube-curation'),
}

const pipelines = {
  TransformFiles: ns.pipeline('#Main'),
}

function parseVariables(str, all) {
  return str
    .split(',')
    .reduce((vars, nameValue) => {
      const [name, value] = nameValue.split('=')

      return vars.set(name, value)
    }, all)
}

async function main() {
  program
    .name('docker run --rm zazuko/datacube-cli')

  program
    .command('transform')
    .description('Transforms source files to RDF')
    .requiredOption('--to <targetName>', "(required) Target to write triples (built-in: 'stdout', 'filesystem', 's3', 'graph-store')")
    .requiredOption('--project <project>', '(required) URL of a Data Cube Curation project')
    .option('-v, --variable <name=value>', 'Pipeline variables', parseVariables, new Map())
    .option('--debug', 'Print diagnostic information to standard output')
    .option('--enable-buffer-monitor', 'enable histogram of buffer usage')
    .option('--auth-issuer <url>', 'OpenID Connect provider to authenticate against')
    .option('--auth-client-id <clientId>', 'Client ID to use to authenticate API calls')
    .option('--auth-client-secret <clientSecret>', 'Client secret to use to authenticate API calls')
    .option('--auth-param <name=value>', 'Additional variables to pass to the token endpoint', parseVariables, new Map())
    .action(transform(pipelines.TransformFiles, __dirname, log))

  return program.parseAsync(process.argv)
}

main()
  .catch(e => {
    log(e)
    process.exit(1)
  })
