import type { Term } from '@rdfjs/types'
import { cc } from '@cube-creator/core/namespace'
import { CONSTRUCT, SELECT } from '@tpluscode/sparql-builder'
import { dcterms, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import TermMap from '@rdfjs/term-map'
import type { Organization } from '@rdfine/schema'
import { parsingClient } from '../../query-client'
import { ResourceStore } from '../../ResourceStore'

export async function findByDimensionMapping(dimensionMapping: Term, client = parsingClient) {
  const [{ metadata }] = await SELECT`?metadata`
    .WHERE`
      graph ?metadata {
        ?metadata ${schema.hasPart}/${cc.dimensionMapping} ${dimensionMapping}
      }
    `
    .LIMIT(1)
    .execute(client.query)

  return metadata
}

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

type DimensionType = Map<Term, Term>

export async function getDimensionTypes(metadata: GraphPointer, store: ResourceStore, client: ParsingClient): Promise<DimensionType> {
  const [first, ...rest] = await SELECT`?dimension ?dimensionType ?cubeIdentifier ?organization`
    .WHERE`
      graph ?project {
        ?project ${cc.dataset} ?dataset .
        ?project ${cc.csvMapping} ?csvMapping .
        ?project ${dcterms.identifier} ?cubeIdentifier .
        ?project ${schema.maintainer} ?organization .
      }

      graph ?dataset {
        ?dataset ${cc.dimensionMetadata} ${metadata.term} ;
      }

      graph ?observationTable {
        ?observationTable a ${cc.ObservationTable} ;
                          ${cc.csvMapping} ?csvMapping ;
                          ${cc.columnMapping} ?column .
      }

      graph ?column {
        ?column ${cc.targetProperty} ?dimension .
        OPTIONAL { ?column ${cc.dimensionType} ?dimensionType . }
      }
    `
    .execute(client.query)

  if (!first) {
    return new TermMap()
  }

  const organization = await store.getResource<Organization>(first.organization)

  return [first, ...rest].reduce((map, row) => {
    if (row.dimension.termType === 'NamedNode' || row.dimension.termType === 'Literal') {
      const dimension = organization.createIdentifier({
        cubeIdentifier: row.cubeIdentifier.value,
        termName: row.dimension,
      })

      return map.set(dimension, row.dimensionType)
    }

    return map
  }, new TermMap<Term, Term>())
}
