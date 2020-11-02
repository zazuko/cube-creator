import { NamedNode } from 'rdf-js'
import { SELECT } from '@tpluscode/sparql-builder'

import { parsingClient } from '../../query-client'
import { cc } from '@cube-creator/core/namespace'

export async function * getTablesForMapping(csvMapping: NamedNode, client = parsingClient) {
  const results = await SELECT.DISTINCT`?table`
    .WHERE`
      GRAPH ?table
      {
        ?table a ${cc.Table} ; 
             ${cc.csvMapping} ${csvMapping} .
      }
      `
    .execute(client.query)
  for (const result of results) {
    const source = result.source
    if (source.termType === 'NamedNode') {
      yield source
    }
  }
}
