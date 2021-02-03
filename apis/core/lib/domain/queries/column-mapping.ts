import { Term } from 'rdf-js'
import { ASK, SELECT } from '@tpluscode/sparql-builder'
import { cc } from '@cube-creator/core/namespace'
import { streamClient, parsingClient } from '../../query-client'

export async function dimensionIsUsedByOtherMapping(columnMapping: Term, client = streamClient): Promise<boolean> {
  return ASK`
            VALUES ?deletedMapping {
              ${columnMapping}
            }

            graph ?deletedMapping {
              ?deletedMapping a ${cc.ColumnMapping} ;
                ${cc.targetProperty} ?deletedTargetProperty .
            }
          
            graph ?table {
              ?table a ${cc.ObservationTable} ;
                ${cc.columnMapping} ?deletedMapping ;
                ${cc.csvMapping} ?csvMapping ;
            }
          
            graph ?otherTable {
              ?otherTable a ${cc.ObservationTable} ;
                          ${cc.csvMapping} ?csvMapping ;
                          ${cc.columnMapping} ?otherMapping ;
            }
          
            graph ?otherMapping {
              ?otherMapping ${cc.targetProperty} ?targetProperty .
            }
          
            filter ( ?deletedTargetProperty = ?targetProperty )
            filter ( ?otherMapping != ?deletedMapping )
            `
    .execute(client.query)
}

export async function * getReferencingMappingsForTable(table: Term, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?columnMapping`
    .WHERE`
      GRAPH ?columnMapping
      {
        ?columnMapping a ${cc.ReferenceColumnMapping} ;
             ${cc.referencedTable} ${table} .
      }
      `
    .execute(client.query)

  for (const result of results) {
    const columnMapping = result.columnMapping
    if (columnMapping.termType === 'NamedNode') {
      yield columnMapping
    }
  }
}
