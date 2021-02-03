import fs from 'fs'
import path from 'path'
import $rdf from 'rdf-ext'
import { parsers } from '@rdfjs/formats-common'
import { DatasetCore } from 'rdf-js'
import StreamClient from 'sparql-http-client/StreamClient'
import { _void } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/rdf-string'
import ParsingClient from 'sparql-http-client/ParsingClient'

const endpoints = (db: 'cube-creator' | 'managed-dimensions') => ({
  updateUrl: `http://db.cube-creator.lndo.site/${db}/update`,
  endpointUrl: `http://db.cube-creator.lndo.site/${db}/query`,
  storeUrl: `http://db.cube-creator.lndo.site/${db}/data`,
})

export const ccClients = {
  parsingClient: new ParsingClient(endpoints('cube-creator')),
  streamClient: new StreamClient(endpoints('cube-creator')),
}

export const mdClients = {
  parsingClient: new ParsingClient(endpoints('managed-dimensions')),
  streamClient: new StreamClient(endpoints('managed-dimensions')),
}

async function removeTestGraphs(client: ParsingClient, dataset: DatasetCore) {
  const graphs = [...dataset.match(null, _void.inDataset)].map(({ subject }) => subject)

  const dropGraphs = sparql`${graphs.map(graph => sparql`DROP SILENT GRAPH ${graph};`)}`.toString()
  return client.query.update(dropGraphs)
}

const insertTestData = async (pathName: string, { parsingClient, streamClient }: { parsingClient: ParsingClient; streamClient: StreamClient }) => {
  const file = fs.createReadStream(path.resolve(process.cwd(), pathName))
  const stream = parsers.import('application/trig', file)

  if (stream) {
    const ds = await $rdf.dataset().import(stream)
    await removeTestGraphs(parsingClient, ds)
    await streamClient.store.post(ds.toStream())
  }
}

export const insertTestProject = () => {
  return insertTestData('fuseki/sample-ubd.trig', ccClients)
}

export const insertTestDimensions = () => {
  return insertTestData('fuseki/managed-dimensions.trig', mdClients)
}
