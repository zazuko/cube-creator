import { NamedNode, Stream, Term } from 'rdf-js'
import { Readable } from 'stream'
import { CONSTRUCT, SELECT, sparql } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client/StreamClient'
import * as ns from '@cube-creator/core/namespace'
import { schema, sh } from '@tpluscode/rdf-ns-builders'
import ParsingClient from 'sparql-http-client/ParsingClient'
import $rdf from 'rdf-ext'
import clownface from 'clownface'

async function selectIdentifiers(datasetId: Term, parsingClient: ParsingClient): Promise<Record<string, NamedNode> | undefined> {
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

function constructPropertyShapes(shape: NamedNode, cubeData: NamedNode, excludeInLists: boolean, streamClient: StreamClient) {
  const deepPaths = excludeInLists ? sparql`(!${sh.in})*` : sparql`(<>|!<>)*`

  return CONSTRUCT`?s ?p ?o. ${shape} ?sp ?so .`
    .FROM(cubeData)
    .WHERE`
      ${shape} ?sp ?so .
      ${shape} ${sh.property} ?property .

      ?property ${sh.path} ?path .
      ?property ${deepPaths} ?s .
      ?s ?p ?o
    `
    .execute(streamClient.query)
}

export async function loadCubeShapes(datasetId: Term, excludeInLists: boolean, { parsingClient, streamClient }: { parsingClient: ParsingClient; streamClient: StreamClient }): Promise<Array<Stream & Readable>> {
  const identifiers = await selectIdentifiers(datasetId, parsingClient)
  if (identifiers) {
    const { cube, cubeData, project, shape } = identifiers
    const graph = clownface({ dataset: $rdf.dataset() })
      .node(project).addOut(ns.cc.cubeGraph, cubeData)
      .node(cube).addOut(ns.cube.observationConstraint, shape)

    return [graph.dataset.toStream(), await constructPropertyShapes(shape, cubeData, excludeInLists, streamClient)]
  }

  return []
}
