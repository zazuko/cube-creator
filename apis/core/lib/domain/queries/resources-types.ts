import type { Term, Quad } from '@rdfjs/types'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { rdf } from '@tpluscode/rdf-ns-builders'
import env from '@cube-creator/core/env'
import { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import $rdf from '@zazuko/env'
import { parsingClient } from '../../query-client.js'

interface Clients {
  sparql?: ParsingClient
}

async function loadRemoteResourceTypes(ids: Set<Term>, sparql: ParsingClient): Promise<Iterable<Quad>> {
  if (!ids.size) {
    return []
  }

  return CONSTRUCT`?resource ${rdf.type} ?type`
    .WHERE`
    SERVICE <${env.PUBLIC_QUERY_ENDPOINT}> {
      values ?resource {
        ${[...ids]}
      }

      GRAPH ?g {
        ?resource a ?type .
      }
    }`.execute(sparql)
}

function loadLocalResourceTypes(local: Set<Term>, sparql: ParsingClient) {
  if (!local.size) {
    return []
  }

  return CONSTRUCT`?resource ${rdf.type} ?type`
    .WHERE`
      values ?resource {
        ${[...local]}
      }
    `
    .WHERE`GRAPH ?g {
        ?resource a ?type .
    }`.execute(sparql)
}

export async function loadResourcesTypes(ids: Term[], { sparql = parsingClient }: Clients = {}): Promise<Quad[]> {
  const { local, remote } = ids.reduce((separated, id) => {
    if (id.value.startsWith(env.API_CORE_BASE)) {
      separated.local.add(id)
    } else {
      separated.remote.add(id)
    }

    return separated
  }, {
    local: $rdf.termSet(),
    remote: $rdf.termSet(),
  })

  const typesFoundRemotely = loadRemoteResourceTypes(remote, sparql)
  const typesFoundLocally = loadLocalResourceTypes(local, sparql)

  return [
    ...await typesFoundLocally,
    ...await typesFoundRemotely,
  ]
}
