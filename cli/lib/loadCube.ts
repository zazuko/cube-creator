import type * as Pipeline from 'barnard59-core/lib/Pipeline'
import { Stream, PassThrough } from 'stream'
import { CONSTRUCT, SELECT, sparql } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { csvw } from '@tpluscode/rdf-ns-builders'
import { cube } from '@cube-creator/core/namespace'
import { loadProject } from './project'
import { fromRdf } from 'rdf-literal'

interface Params {
  jobUri: string
  endpoint: string
  user: string
  password: string
}

const LIMIT = 1000000

/**
 * Opens a SPARQL stream reading the cube, excluding the Cube Constraint subgraph,
 * which will be processed alongside the rest of cube metadata
 */
export async function loadCube(this: Pipeline.Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const project = await loadProject(jobUri, this)

  const clientConfig = {
    endpointUrl: endpoint,
    user,
    password,
  }
  const client = new StreamClient(clientConfig)
  const parsingClient = new ParsingClient(clientConfig)

  const patterns = sparql`
    ?s ?p ?o .
    ?cube a ${cube.Cube} ; !${cube.observationConstraint}* ?s .

    filter (?p != ${csvw.describes})`

  const [{ count }] = await SELECT`(COUNT(*) as ?count)`
    .FROM(project.cubeGraph)
    .WHERE`${patterns}`
    .execute(parsingClient.query) as any

  const total = fromRdf(count)
  const queries: ReturnType<typeof CONSTRUCT>[] = []
  let offset = 0
  while (offset < total) {
    queries.push(await CONSTRUCT`?s ?p ?o`
      .FROM(project.cubeGraph)
      .WHERE`${patterns}`
      .LIMIT(LIMIT)
      .OFFSET(offset))

    offset += LIMIT
  }

  const combined = new PassThrough({
    objectMode: true,
  })
  const next = async () => {
    const current = await queries.shift()?.execute(client.query)
    if (current) {
      this.logger.info('Fetching next cube chunk')
      current.pipe(combined, {
        end: false,
      })
      current.on('error', e => combined.destroy(e))
      current.on('end', next)
    } else {
      combined.end()
    }
  }

  next()
  return combined
}
