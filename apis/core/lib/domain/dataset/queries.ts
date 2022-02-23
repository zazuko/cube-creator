import { Term } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { SELECT } from '@tpluscode/sparql-builder'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { ResultRow } from 'sparql-http-client/ResultParser'
import { parsingClient } from '../../query-client'

export function getCubesAndGraphs(dataset: Term, client: ParsingClient = parsingClient): Promise<ResultRow[]> {
  return SELECT`?cube ?graph`
    .WHERE`
      graph ?project {
          ?project ${cc.dataset} ${dataset} ;
                   ${cc.cubeGraph} ?graph ;
                   a ${cc.CubeProject} .
      }

      graph ${dataset} {
          ${dataset} ${schema.hasPart} ?cube .
      }
    `.execute(client.query)
}
