import { Term, Quad } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { rdf } from '@tpluscode/rdf-ns-builders'
import { parsingClient } from '../../query-client'

export async function loadResourcesTypes(ids: Term[], client = parsingClient): Promise<Quad[]> {
  return CONSTRUCT`?resource ${rdf.type} ?type`
    .WHERE`
      values ?resource {
        ${ids}
      }
    `
    .WHERE`GRAPH ?g {
        ?resource a ?type .
    }`.execute(client.query)
}
