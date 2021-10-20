import { Variable, Literal, NamedNode, Stream } from 'rdf-js'
import $rdf from 'rdf-ext'
import { Readable } from 'stream'
import StreamClient from 'sparql-http-client'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import { SparqlQueryExecutable } from '@tpluscode/sparql-builder/lib'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { streamClient } from '../../query-client'
import * as DetailParts from './details/index'

interface GetProjectDetails{
  project: NamedNode
  resource: NamedNode
  client?: StreamClient
}

export interface ProjectDetailPart {
  (project: NamedNode, variable: Variable): [SparqlQueryExecutable, ...[Literal, ...Literal[]]]
}

export function getProjectDetails({
  project,
  resource,
  client = streamClient,
}: GetProjectDetails): Promise<Stream & Readable> {
  const parts = Object.values(DetailParts)

  const { graph, patterns } = parts.reduce(({ patterns, graph }, buildPart, index) => {
    const variable = $rdf.variable(`part${index + 1}`)

    const [subselect, ...labels] = buildPart(project, variable)

    return {
      graph: sparql`${graph}

      ?details ${schema.hasPart} [
        ${schema.name} ${labels} ;
        ${schema.value} ${variable} ;
      ] .`,
      patterns: sparql`${patterns}

      {
        ${subselect}
      }`,
    }
  }, {
    graph: sparql``,
    patterns: sparql`BIND ( ${resource} as ?details )`,
  })

  return CONSTRUCT`${graph}`.WHERE`${patterns}`.execute(client.query)
}
