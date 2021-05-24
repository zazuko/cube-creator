import ParsingClient from 'sparql-http-client/ParsingClient'
import StreamClient from 'sparql-http-client/StreamClient'
import fs from 'fs'
import path from 'path'
import { parsers } from '@rdfjs/formats-common'
import $rdf from 'rdf-ext'
import { DatasetCore } from 'rdf-js'
import { xsd, _void } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/rdf-string'
import RdfPxParser from 'rdf-parser-px'
import TripleToQuadTransform from 'rdf-transform-triple-to-quad'
import { ccClients, mdClients } from './index'

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

export const insertTestProject = async () => {
  await insertTestData('fuseki/sample-ubd.trig', ccClients)
  await insertTestData('fuseki/sample-px.trig', ccClients)
}

export const insertTestDimensions = () => {
  return insertTestData('fuseki/shared-dimensions.trig', mdClients)
}

export const insertPxCube = () => {
  const client = new StreamClient({
    endpointUrl: process.env.PX_CUBE_QUERY_ENDPOINT!,
    storeUrl: process.env.PX_CUBE_GRAPH_ENDPOINT!,
  })

  const pxStream = fs.createReadStream(path.resolve(__dirname, '../../../fuseki/px-x-0703010000_103.px'))
  const parser = new RdfPxParser({
    baseIRI: process.env.PX_CUBE_BASE!,
    encoding: 'iso-8859-15',
    metadata: [{
      titles: 'Jahr',
      datatype: xsd.gYear.value,
    }],
    observer: 'http://example.org/observer',
  })

  const pxCubeStream = parser.import(pxStream)
    .pipe(new TripleToQuadTransform($rdf.namedNode(process.env.PX_CUBE_GRAPH!)))

  return client.store.put(pxCubeStream)
}
