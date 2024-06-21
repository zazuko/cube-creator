import type { NamedNode, Quad } from '@rdfjs/types'
import { DESCRIBE } from '@tpluscode/sparql-builder'
import { ParsingClient } from 'sparql-http-client/ParsingClient.js'

interface DescribeResource {
  resourceId: NamedNode
  client: ParsingClient
  graph?: NamedNode
}

export async function describeResource({ resourceId, client, graph }: DescribeResource): Promise<Iterable<Quad>> {
  const describe = DESCRIBE`${resourceId}`

  if (graph) {
    return describe.FROM(graph).execute(client)
  }

  return describe.execute(client)
}
