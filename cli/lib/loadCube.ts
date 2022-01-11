import type * as Pipeline from 'barnard59-core/lib/Pipeline'
import { Stream } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
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

/**
 * Opens a SPARQL stream reading the cube, excluding the Cube Constraint subgraph,
 * which will be processed alongside the rest of cube metadata
 */
export async function loadCube(this: Pipeline.Context, { jobUri, endpoint, user, password }: Params): Promise<Stream> {
  const project = await loadProject(jobUri, this)

  const query = CONSTRUCT`?s ?p ?o`
    .FROM(project.cubeGraph)
    .WHERE`
      ?s ?p ?o .
      ?cube a ${cube.Cube} ; !${cube.observationConstraint}* ?s .

      filter (?p != ${csvw.describes})
    `

  return query.execute(new StreamClient({
    endpointUrl: endpoint,
    user,
    password,
  }).query)
}
