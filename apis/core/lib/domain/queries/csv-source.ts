import type { Term } from '@rdfjs/types'
import { ASK } from '@tpluscode/sparql-builder'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { streamClient } from '../../query-client.js'

export async function sourceWithFilenameExists(csvMapping: Term, fileName: string, client = streamClient): Promise<boolean> {
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
    .execute(client)
}
