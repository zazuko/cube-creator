import { CONSTRUCT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import { cc, cube } from '@cube-creator/core/namespace'
import { Stream, Term } from 'rdf-js'
import { csvw, schema } from '@tpluscode/rdf-ns-builders'
import { Readable } from 'stream'

export function loadCubeShapes(dataset: Term, client: StreamClient): Promise<Stream & Readable> {
  return CONSTRUCT`
    ?s ?p ?o .
    ?cube ${cube.observationConstraint} ?shape .
    ?project ${cc.cubeGraph} ?cubeData .
  `
    .WHERE`
    GRAPH ?project {
      ?project ${cc.dataset} ${dataset} ;
               ${cc.cubeGraph} ?cubeData .
    }

    GRAPH ${dataset} {
      ${dataset} ${schema.hasPart} ?cube
    }

    GRAPH ?cubeData {
      ?s ?p ?o .
      ?cube ${cube.observationConstraint} ?shape .

      # Exclude non-observation resources mapped from CSV rows
      MINUS { ?s ${csvw.describes} ?o }
      MINUS { ?s ^${csvw.describes} ?row }

      # Exclude cube details from result
      MINUS { ?s a ${cube.Observation} }
      MINUS { ?s a ${cube.Cube} }
      MINUS { ?s a ${cube.ObservationSet} }
    }`
    .execute(client.query)
}
