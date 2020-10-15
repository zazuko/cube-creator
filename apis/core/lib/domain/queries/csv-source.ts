import { NamedNode } from 'rdf-js'
import { ASK } from '@tpluscode/sparql-builder'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { client } from './query-client'

export async function sourceWithFilenameExists(csvMapping: NamedNode, fileName: string): Promise<boolean> {
  return ASK`
      GRAPH ${csvMapping} 
      {
        ${csvMapping} ${cc.csvSource} ?source
      }
      GRAPH ?source
      {
        ?source ${schema.name} "${fileName}"
      }
      `
    .execute(client.query)
}
