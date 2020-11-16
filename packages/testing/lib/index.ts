import fs from 'fs'
import path from 'path'
import $rdf from 'rdf-ext'
import { parsers } from '@rdfjs/formats-common'
import { SELECT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import env from '@cube-creator/core/env'
import { _void } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/rdf-string'
import ParsingClient from 'sparql-http-client/ParsingClient'

export const client = new StreamClient({
  updateUrl: 'http://db.cube-creator.lndo.site/cube-creator/update',
  endpointUrl: 'http://db.cube-creator.lndo.site/cube-creator/query',
  storeUrl: 'http://db.cube-creator.lndo.site/cube-creator/data',
})

const parsingClient = new ParsingClient({
  updateUrl: 'http://db.cube-creator.lndo.site/cube-creator/update',
  endpointUrl: 'http://db.cube-creator.lndo.site/cube-creator/query',
  storeUrl: 'http://db.cube-creator.lndo.site/cube-creator/data',
})

const clientOptions = () => ({
  base: env.API_CORE_BASE,
})

async function removeTestGraphs() {
  const graphs = await SELECT.DISTINCT`?graph`
    .WHERE`
      ?graph ${_void.inDataset} ?d.
    `.execute(parsingClient.query, clientOptions())

  const dropGraphs = sparql`${graphs.map(result => sparql`DROP SILENT GRAPH ${result.graph};`)}`.toString()
  return client.query.update(dropGraphs)
}

export const insertTestData = async (pathName: string) => {
  await removeTestGraphs()

  const file = fs.createReadStream(path.resolve(process.cwd(), pathName))
  const stream = parsers.import('application/trig', file)

  if (stream) {
    const ds = await $rdf.dataset().import(stream)
    await client.store.post(ds.toStream())
  }
}
