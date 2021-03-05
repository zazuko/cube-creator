import { ASK, SELECT } from '@tpluscode/sparql-builder'
import { dcterms, schema } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { NamedNode, Term } from 'rdf-js'
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

export function exists(cubeIdentifier: string, maintainer: Term, client = parsingClient): Promise<boolean> {
  return ASK`graph ?project {
    ?project ${dcterms.identifier} ${$rdf.literal(cubeIdentifier)} .
    ?project ${schema.maintainer} ${maintainer}
  }`.execute(client.query)
}
