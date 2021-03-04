import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { parsingClient } from '../../query-client'
import { cc } from '@cube-creator/core/namespace'
import { Term } from 'rdf-js'
import { rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { ParsingClient } from 'sparql-http-client/ParsingClient'

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

export async function getMappedDimensions(metadata: GraphPointer, dimensionsEndpoint: ParsingClient) {
  const dimensionQuads = await CONSTRUCT`
      ?mapping ${cc.sharedDimension} ?dimension .
    `
    .WHERE`
      GRAPH ${metadata.term} {
        ${metadata.term} ${schema.hasPart} ?dimensionMeta .
        ?dimensionMeta ${cc.dimensionMapping} ?mapping .
      }

      GRAPH ?mapping {
        ?mapping ${cc.sharedDimension} ?dimension .
      }
    `
    .execute(parsingClient.query)

  const dimensions = dimensionQuads.map(({ object }) => object)
  const labelQuads = await CONSTRUCT`
      ?dimension ${rdfs.label} ?label .
    `
    .WHERE`
      VALUES ?dimension { ${dimensions} }

      graph ?g {
        ?dimension ${rdfs.label}|${schema.name} ?label
      }
    `
    .execute(dimensionsEndpoint.query)

  return [...dimensionQuads, ...labelQuads]
}
