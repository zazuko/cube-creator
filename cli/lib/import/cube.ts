import type { NamedNode } from '@rdfjs/types'
import type { Context } from 'barnard59-core'
import StreamClient from 'sparql-http-client'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import * as ns from '@cube-creator/core/namespace'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'

interface CubeQuery {
  endpoint: NamedNode
  graph: NamedNode | undefined
  cube: NamedNode
}

/**
 * Fetches all cube data, excluding metadata. Only shape and observations
 */
export default async function query(this: Context, { endpoint, cube, graph }: CubeQuery) {
  const client = new StreamClient({
    endpointUrl: endpoint.value,
  })

  let query = CONSTRUCT`
    ${cube} a ${ns.cube.Cube} ;
            ${ns.cube.observationConstraint}  ?shape ;
            ${ns.cube.observationSet} ?set .
    ?shape ?shapeP ?shapeO .
    ?propertyS ?propertyP ?propertyO .

    ?set ${ns.cube.observation} ?observation .
    ?observationS ?observationP ?observationO .`
    .WHERE`
    {
      # Constraint Shape properties
      ${cube}
        a ${ns.cube.Cube} ;
        ${ns.cube.observationConstraint} ?shape ;
      .

      ?shape ?shapeP ?shapeO .
    }
    union
    {
      # Property Shape properties need to be queried deep to get RDF Lists
      ${cube} a ${ns.cube.Cube} ;
              ${ns.cube.observationConstraint}/${sh.property} ?property .

      ?property (<>|!<>)* ?propertyS .
      ?propertyS ?propertyP ?propertyO .

      filter(
        # Only keep SHACL and RDF to exclude any dimension metadata
        regex(str(?propertyP), str(${sh()})) || regex(str(?propertyP), str(${rdf()}))
      )
    }
    union
    {
      # Actual observation data
      ${cube} a ${ns.cube.Cube} ;
              ${ns.cube.observationSet} ?set .

      ?set ${ns.cube.observation} ?observation .
      ?observation (<>|!<>)* ?observationS .
      ?observationS ?observationP ?observationO .
    }
    `

  if (graph) {
    query = query.FROM(graph)
  }

  return query.execute(client.query)
}
