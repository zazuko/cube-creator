import { Term, Quad } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { rdf } from '@tpluscode/rdf-ns-builders'
import env from '@cube-creator/core/env'
import TermSet from '@rdfjs/term-set'
import { parsingClient } from '../../query-client'

interface Clients {
  sparql?: typeof parsingClient
}

async function loadRemoteResourceTypes(ids: TermSet, sparql: typeof parsingClient): Promise<Quad[]> {
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
    }`.execute(sparql.query)
}

function loadLocalResourceTypes(local: TermSet, sparql: typeof parsingClient) {
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
    }`.execute(sparql.query)
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
    local: new TermSet(),
    remote: new TermSet(),
  })

  const typesFoundRemotely = loadRemoteResourceTypes(remote, sparql)
  const typesFoundLocally = loadLocalResourceTypes(local, sparql)

  return [
    ...await typesFoundLocally,
    ...await typesFoundRemotely,
  ]
}
