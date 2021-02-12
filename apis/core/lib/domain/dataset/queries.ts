import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { SELECT } from '@tpluscode/sparql-builder'
import { Term } from 'rdf-js'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { parsingClient } from '../../query-client'

export function getCubesAndGraphs(dataset: Term, client: ParsingClient = parsingClient): Promise<Array<Record<'cube' | 'graph', Term>>> {
  return SELECT`?cube ?graph`
    .WHERE`
      graph ?project {
          ?project ${cc.dataset} ${dataset} ;
                   ${cc.cubeGraph} ?graph .
      }

      graph ${dataset} {
          ${dataset} ${schema.hasPart} ?cube .
      }
    `.execute(client.query)
}
