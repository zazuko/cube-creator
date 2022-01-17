import type * as Pipeline from 'barnard59-core/lib/Pipeline'
import { Stream, PassThrough } from 'stream'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { cube } from '@cube-creator/core/namespace'
import { loadProject } from './project'

interface Params {
  jobUri: string
  endpoint: string
  user: string
  password: string
}

const LIMIT = parseInt(process.env.CUBE_QUERY_LIMIT || '0', 10) || 1000000

/**
 * Opens a SPARQL stream reading the cube, excluding the Cube Constraint subgraph,
 * which will be processed alongside the rest of cube metadata
 */
export async function loadCube(this: Pipeline.Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const project = await loadProject(jobUri, this)

  const client = new StreamClient({
    endpointUrl: endpoint,
    user,
    password,
  })

  const patterns = sparql`
    ?s ?p ?o .
    ?cube a ${cube.Cube} ; !${cube.observationConstraint}* ?s .

    filter (?p != ${csvw.describes})`

  let offset = 0

  const combined = new PassThrough({
    objectMode: true,
  })
  const next = async () => {
    const query = CONSTRUCT`?s ?p ?o`
      .FROM(project.cubeGraph)
      .WHERE`${patterns}`
      .LIMIT(LIMIT)
      .OFFSET(offset)
    offset += LIMIT

    let received = false
    const current = await query.execute(client.query)
    this.logger.info(`Fetching next cube chunk (OFFSET=${offset})`)
    current.pipe(combined, {
      end: false,
    })
    current.once('data', () => {
      received = true
    })
    current.on('error', e => combined.destroy(e))
    current.on('end', () => {
      received ? next() : combined.end()
    })
  }

  next()
  return combined
}
