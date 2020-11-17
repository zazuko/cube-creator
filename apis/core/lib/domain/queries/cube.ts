import { GraphPointer } from 'clownface'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import { cc, cube } from '@cube-creator/core/namespace'
import { Stream } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import { Readable } from 'stream'

export function loadCubeShapes(dataset: GraphPointer, client: StreamClient): Promise<Stream & Readable> {
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
