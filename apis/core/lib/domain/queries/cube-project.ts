import { SELECT } from '@tpluscode/sparql-builder'
import { NamedNode } from 'rdf-js'
import { cc } from '@cube-creator/core/namespace'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { parsingClient } from '../../query-client'

export async function findProject(metadataCollection: DimensionMetadataCollection): Promise<NamedNode | undefined> {
  const result = await SELECT`?project`
    .WHERE`
      GRAPH ?dataset {
        ?dataset ${cc.dimensionMetadata} ${metadataCollection.id}
      }

      GRAPH ?project {
        ?project ${cc.dataset} ?dataset .
      }
    `
    .execute(parsingClient.query)

  return result[0]?.project as any
}
