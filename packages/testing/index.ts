import program from 'commander'
import debug from 'debug'
import { insertTestDimensions, insertTestProject } from './lib'

const log = debug('testing')
log.enabled = true

async function main() {
  program
    .option('-i, --inputs <inputs...>')

  const command = program.parse(process.argv)
  const { inputs } = command.opts()

  if (inputs.includes('ubd')) {
    await insertTestProject()
  }
  if (inputs.includes('dimensions')) {
    return insertTestDimensions()
  }
}

main()
  .catch(e => {
    log(e)
    process.exit(1)
  })
