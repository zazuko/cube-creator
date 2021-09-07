import { CsvMapping, Table } from '@cube-creator/model'
import { ASK, CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { NamedNode, Quad, Term } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { parsingClient } from '../../query-client'
import $rdf from 'rdf-ext'

type FindOrganization = {
  table: Table
} | {
  csvMapping: CsvMapping
}

interface Ids {
  projectId: Term
  organizationId: Term
}

export async function findOrganization(findBy: FindOrganization, client = parsingClient): Promise<Partial<Ids>> {
  const project = $rdf.variable('projectId')
  const organization = $rdf.variable('organizationId')

  let query = SELECT`${organization} ${project}`
    .WHERE`graph ${project} {
      ${project} ${schema.maintainer} ${organization} .
    }`

  if ('csvMapping' in findBy) {
    query = query.WHERE`
      graph ${project} {
        ${project} ${cc.csvMapping} ${findBy.csvMapping.id} .
      }
    `
  } else {
    query = query.WHERE`
      graph ${project} {
        ${project} ${cc.csvMapping} ?mapping .
      }

      graph ${findBy.table.id} {
        ${findBy.table.id} ${cc.csvMapping} ?mapping
      }
    `
  }

  const result = await query.execute(client.query)

  return result[0]
}

export function cubeNamespaceAllowed(cube: NamedNode, organization: Term, client = parsingClient): Promise<boolean> {
  return ASK`graph ${organization} {
    ${organization} ${cc.namespace} ?ns .

    FILTER (
      STRSTARTS( str(${cube}), str(?ns) )
    )
  }`.execute(client.query)
}

export function fetchOrganizationDatasets(organization: NamedNode, client = parsingClient): Promise<Quad[]> {
  return CONSTRUCT`?s ?p ?o`
    .WHERE`
      GRAPH ?project {
        ?project ${schema.maintainer} ${organization} .
        ?project ${cc.dataset} ?dataset .
      }
      GRAPH ?dataset {
        ?s ?p ?o .
      }
    `.execute(client.query)
}
