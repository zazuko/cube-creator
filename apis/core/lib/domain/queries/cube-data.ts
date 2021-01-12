import { NamedNode, Quad } from 'rdf-js'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import { parsingClient } from '../../query-client'

export async function describeResource(graph: NamedNode, resourceId: NamedNode, client = parsingClient): Promise<Quad[]> {
  return DESCRIBE`${resourceId}`
    .FROM(graph)
    .execute(client.query)
}
