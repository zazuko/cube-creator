import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import * as ns from '@cube-creator/core/namespace'
import { NamedNode, Stream, Term } from 'rdf-js'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import { Readable } from 'stream'
import ParsingClient from 'sparql-http-client/ParsingClient'
import $rdf from 'rdf-ext'
import clownface from 'clownface'

async function selectIdentifiers(datasetId: Term, parsingClient: ParsingClient): Promise<Record<string, NamedNode>> {
  const [result] = await SELECT`?cube ?cubeData ?project ?shape`
    .WHERE`
      GRAPH ?project {
        ?project ${ns.cc.dataset} ${datasetId} ;
                 ${ns.cc.cubeGraph} ?cubeData .
      }

      GRAPH ${datasetId} {
        ${datasetId} ${schema.hasPart} ?cube
      }

      graph ?cubeData {
        ?cube ${ns.cube.observationConstraint} ?shape .
      }
    `.execute(parsingClient.query)

  return result as any
}

function constructPropertyShapes(shape: NamedNode, cubeData: NamedNode, streamClient: StreamClient) {
  return CONSTRUCT`?s ?p ?o. ${shape} ?sp ?so .`
    .FROM(cubeData)
    .WHERE`
      ${shape} ?sp ?so .
      ${shape} ${sh.property} ?property .

      ?property ${sh.path} ?path .
      ?property (<>|!<>)* ?s .
      ?s ?p ?o
    `
    .execute(streamClient.query)
}

export async function loadCubeShapes(datasetId: Term, { parsingClient, streamClient }: { parsingClient: ParsingClient; streamClient: StreamClient }): Promise<Stream & Readable> {
  const { cube, cubeData, project, shape } = await selectIdentifiers(datasetId, parsingClient)

  const graph = clownface({ dataset: $rdf.dataset() })
  graph.node(project).addOut(ns.cc.cubeGraph, cubeData)
  graph.node(cube).addOut(ns.cube.observationConstraint, shape)

  await graph.dataset.import(await constructPropertyShapes(shape, cubeData, streamClient))

  return graph.dataset.toStream()
}
