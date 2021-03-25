const { parsers } = require('@rdfjs/formats-common')
const fs = require('fs')
const { turtle } = require('@tpluscode/rdf-string')
const $rdf = require('rdf-ext')

const stream = parsers.import('application/ld+json', fs.createReadStream('./test.nq'))

async function main() {
  const dataset = await $rdf.dataset().import(stream)

  const str = turtle`${dataset}`.toString()

  return str.length
}

main().then(console.log)
