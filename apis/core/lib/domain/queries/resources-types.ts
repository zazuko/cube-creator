import { Term, Quad } from 'rdf-js'
import { CONSTRUCT } from '@tpluscode/sparql-builder'
import { rdf } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import rdfFetch from '@rdfjs/fetch'
import env from '@cube-creator/core/env'
import TermSet from '@rdfjs/term-set'
import { log } from '../../log'
import { parsingClient } from '../../query-client'

interface Clients {
  sparql?: typeof parsingClient
  fetch?: typeof rdfFetch
}

async function loadRemoteResourceTypes(id: Term, fetch: typeof rdfFetch): Promise<Quad[]> {
  try {
    const resource = await fetch(id.value, { factory: $rdf })
    const dataset = await resource.dataset()
    return dataset.match(id, rdf.type).toArray()
  } catch (e) {
    log(e)
    return []
  }
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

export async function loadResourcesTypes(ids: Term[], { sparql = parsingClient, fetch = rdfFetch }: Clients = {}): Promise<Quad[]> {
  const { local, remote } = ids.reduce((separated, id) => {
    if (id.value.startsWith(env.API_CORE_BASE)) {
      separated.local.add(id)
    } else {
      separated.remote.push(loadRemoteResourceTypes(id, fetch))
    }

    return separated
  }, {
    local: new TermSet(),
    remote: [] as Promise<Quad[]>[],
  })

  const typesFoundRemotely = Promise.all(remote)
  const typesFoundLocally = loadLocalResourceTypes(local, sparql)

  return [
    ...await typesFoundLocally,
    ...(await typesFoundRemotely).flatMap(arr => arr),
  ]
}
