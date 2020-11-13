import { NamedNode } from 'rdf-js'
import { SELECT } from '@tpluscode/sparql-builder'

import { parsingClient } from '../../query-client'
import { cc } from '@cube-creator/core/namespace'

export async function * getTablesForMapping(csvMapping: NamedNode, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?table`
    .WHERE`
      GRAPH ?table
      {
        ?table a ${cc.Table} ;
             ${cc.csvMapping} ${csvMapping} .
      }
      `
    .execute(client.query)

  for (const result of results) {
    const table = result.table
    if (table.termType === 'NamedNode') {
      yield table
    }
  }
}

export async function * getLinkedTablesForSource(csvSource: NamedNode, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?table`
    .WHERE`
      GRAPH ?table
      {
        ?table a ${cc.Table} ;
             ${cc.csvSource} ${csvSource} .
      }
      `
    .execute(client.query)

  for (const result of results) {
    const table = result.table
    if (table.termType === 'NamedNode') {
      yield table
    }
  }
}
