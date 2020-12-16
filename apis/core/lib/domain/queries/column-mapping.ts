import { Term } from 'rdf-js'
import { ASK } from '@tpluscode/sparql-builder'
import { cc } from '@cube-creator/core/namespace'
import { streamClient } from '../../query-client'

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
              ?table a ${cc.Table} ;
                ${cc.columnMapping} ?deletedMapping ;
                ${cc.csvMapping} ?csvMapping ;
            }
          
            graph ?otherTable {
              ?otherTable ${cc.csvMapping} ?csvMapping ;
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
