import program from 'commander'
import debug from 'debug'
import { insertTestData } from './lib'

const log = debug('testing')
log.enabled = true

function main() {
  program
    .option('-i, --input <input>')

  const { input } = program.parse(process.argv)

  return insertTestData(input)
}

main()
  .catch(e => {
    log(e)
    process.exit(1)
  })
