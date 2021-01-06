import { CsvMapping, Table } from '@cube-creator/model'
import { SELECT } from '@tpluscode/sparql-builder'
import { Term } from 'rdf-js'
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
      ${project} ${schema.maintainer} {organization}
    }`

  if ('csvMapping' in findBy) {
    query = query.WHERE`
      graph ${findBy.csvMapping} {
        ${findBy.csvMapping} ${cc.project} ${project}
      }
    `
  } else {
    query = query.WHERE`
      graph ${findBy.table} {
        ${findBy.table} ${cc.csvMapping} ?mapping
      }

      graph ?mapping {
        ?mapping ${cc.project} ${project}
      }
    `
  }

  const result = await query.execute(client.query)

  return result[0]
}
