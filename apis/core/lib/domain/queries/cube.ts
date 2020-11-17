import { GraphPointer } from 'clownface'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { cc, cube } from '@cube-creator/core/namespace'
import { Quad } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'

export function loadCubeShapes(dataset: GraphPointer, client: ParsingClient): Promise<Quad[]> {
  return CONSTRUCT`
    ?s ?p ?o .
    ?cube ${cube.observationConstraint} ?shape .
  `
    .WHERE`
    GRAPH ?project {
      ?project ${cc.dataset} ${dataset.term} ;
               ${cc.cubeGraph} ?cubeData .
    }

    GRAPH ${dataset.term} {
      ${dataset.term} ${schema.hasPart} ?cube
    }

    GRAPH ?cubeData {
      ?s ?p ?o .
      ?cube ${cube.observationConstraint} ?shape .

      MINUS { ?s a ${cube.Observation} }
      MINUS { ?s a ${cube.Cube} }
      MINUS { ?s a ${cube.ObservationSet} }
    }`
    .execute(client.query)
}
