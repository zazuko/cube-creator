import fs from 'fs'
import path from 'path'
import { parsers } from '@rdfjs/formats-common'
import { DELETE } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import env from '@cube-creator/core/env'
import { _void } from '@tpluscode/rdf-ns-builders'

export const client = new StreamClient({
  updateUrl: 'http://db.cube-creator.lndo.site/cube-creator/update',
  endpointUrl: 'http://db.cube-creator.lndo.site/cube-creator/query',
  storeUrl: 'http://db.cube-creator.lndo.site/cube-creator/data',
})

const clientOptions = () => ({
  base: env.API_CORE_BASE,
})

function removeTestGraphs() {
  return DELETE`graph ?g { ?s ?p ?o }`
    .WHERE`
      ?g a ${_void.Dataset} .
    `
    .WHERE`graph ?g { ?s ?p ?o }`
    .execute(client.query, clientOptions())
}

export const insertTestData = async (pathName: string) => {
  await removeTestGraphs()

  const file = fs.createReadStream(path.resolve(process.cwd(), pathName))
  const stream = parsers.import('application/trig', file)

  if (stream) {
    await client.store.put(stream)
  }
}
