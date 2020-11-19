
import { SELECT } from '@tpluscode/sparql-builder'
import { parsingClient } from '../../query-client'
import { cc } from '@cube-creator/core/namespace'
import { Term } from 'rdf-js'

export async function getDimensionMetaDataCollection(csvMapping: Term, client = parsingClient) {
  const results = await SELECT
    .DISTINCT`?dimensionMetadata`
    .WHERE`
        GRAPH ?project
        {
            ?project ${cc.csvMapping} ${csvMapping} ;
            ${cc.dataset} ?dataset .
        }
        GRAPH ?dataset
        {
            ?dataset ${cc.dimensionMetadata} ?dimensionMetadata .
        }
        `
    .execute(client.query)
  if (results.length < 1) {
    throw new Error(`No DimensionMetadata for table ${csvMapping} found`)
  }
  if (results.length > 1) {
    throw new Error(`More than one DimensionMetadata for table ${csvMapping} found`)
  }
  return results[0].dimensionMetadata
}
