import type { Term, Quad } from '@rdfjs/types'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { schema } from '@tpluscode/rdf-ns-builders'
import { parsingClient } from '../../query-client.js'

export async function loadResourceLabels(ids: Term[], client = parsingClient): Promise<Iterable<Quad>> {
  return CONSTRUCT`?resource ${schema.name} ?object`
    .WHERE`
      values ?resource {
        ${ids}
      }
    `
    .WHERE`
      GRAPH ?g {
        ?resource ${schema.name} ?object .
      }
    `.execute(client)
}
