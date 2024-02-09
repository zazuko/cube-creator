import type { Variable, Literal, NamedNode } from '@rdfjs/types'
import $rdf from 'rdf-ext'
import { CONSTRUCT, sparql } from '@tpluscode/sparql-builder'
import { SparqlGraphQueryExecutable, SparqlQuery, SparqlQueryExecutable } from '@tpluscode/sparql-builder/lib'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { lindasSchema } from '@cube-creator/core/namespace'
import * as DetailParts from './details/index'

export interface ProjectDetailPart {
  (project: NamedNode, variable: Variable): [SparqlQueryExecutable, ...[Literal, ...Literal[]]]
}

interface GetProjectDetails{
  project: NamedNode
  resource: NamedNode
  parts?: ProjectDetailPart[]
}

export function getProjectDetails({
  project,
  resource,
  parts = Object.values(DetailParts),
}: GetProjectDetails): SparqlGraphQueryExecutable & SparqlQuery {
  const { graph, patterns } = parts.reduce(({ patterns, graph }, buildPart, index) => {
    const variable = $rdf.variable(`part${index + 1}`)

    const [subselect, ...labels] = buildPart(project, variable)
    const part = $rdf.namedNode(`urn:part:${index + 1}`)

    return {
      graph: sparql`${graph}

      ?details ${schema.hasPart} ${part} .
      ${part}
        ${schema.name} ${labels} ;
        ${schema.value} ${variable} ;
        ${schema.about} ${project} ;
        ${lindasSchema.datasetNextDateModified} ?dateNextModified ;
      .`,
      patterns: sparql`${patterns}

      OPTIONAL {
        ${subselect}
      }`,
    }
  }, {
    graph: sparql``,
    patterns: sparql`BIND ( ${resource} as ?details )`,
  })

  return CONSTRUCT`${graph}`.WHERE`${patterns}`
}
