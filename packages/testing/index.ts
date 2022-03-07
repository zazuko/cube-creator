import program from 'commander'
import debug from 'debug'
import { insertTestDimensions, insertTestProject, insertPxCube, insertTestHierarchies } from './lib/seedData'

const log = debug('testing')
log.enabled = true

async function main() {
  program
    .option('-i, --inputs <inputs...>')

  const command = program.parse(process.argv)
  const { inputs } = command.opts()

  if (inputs.includes('ubd')) {
    log('Inserting sample project')
    await insertTestProject()
  }
  if (inputs.includes('dimensions')) {
    log('Inserting sample shared dimensions')
    await insertTestDimensions()
  }
  if (inputs.includes('px-cube')) {
    log('Inserting PX cube')
    await insertPxCube()
  }
  if (inputs.includes('hierarchies')) {
    log('Inserting hierarchies')
    await insertTestHierarchies()
  }
}

main()
  .catch(e => {
    log(e)
    process.exit(1)
  })
