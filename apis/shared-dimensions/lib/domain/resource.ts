import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/rdf-string'
import { AnyPointer, GraphPointer } from 'clownface'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { query } from '@cube-creator/core/namespace'
import { SELECT } from '@tpluscode/sparql-builder'
import { ParsingClient } from 'sparql-http-client/ParsingClient'
import { SharedDimensionsStore } from '../store'
import { error } from '../log'
import env from '../env'
import { parsingClient } from '../sparql'

interface CascadeDelete {
  store: SharedDimensionsStore
  term: NamedNode
  api: AnyPointer
  client?: ParsingClient
}

function toSparqlPath(path: GraphPointer) {
  if (path.term.termType === 'NamedNode') {
    return path.term
  }

  if (path.term.termType !== 'BlankNode') {
    throw new Error('Unexpected SHACL path')
  }

  if (path.has(sh.inversePath).term) {
    return sparql`^${path.out(sh.inversePath).term}`
  }

  throw new Error('Unexpected SHACL path')
}

async function findResourcesToDelete(term: NamedNode, paths: GraphPointer[], client: ParsingClient) {
  if (paths.length === 0) {
    return []
  }

  const query = paths.reduce((query, path, index) => {
    if (index === 0) {
      return query.WHERE`{ ${term} ${toSparqlPath(path)} ?term }`
    } else {
      return query.WHERE`union\n{ ${term} ${toSparqlPath(path)} ?term }`
    }
  }, SELECT`?term`.FROM($rdf.namedNode(env.MANAGED_DIMENSIONS_GRAPH)))

  const results = await query.execute(client.query)

  return results.map(row => row.term as NamedNode)
}

export async function cascadeDelete({ store, term, api, client = parsingClient }: CascadeDelete): Promise<void> {
  const resource = await store.load(term)
  const resourceTypes = resource.out(rdf.type)
  const pathsToCascade = api.node(resourceTypes).out(query.cascadeDelete).toArray()
  const resourcesToDelete = await findResourcesToDelete(term, pathsToCascade, client)

  await store.delete(term)

  for (const cascadeDeleted of resourcesToDelete) {
    cascadeDelete({
      term: cascadeDeleted,
      store,
      api,
    }).catch(e => {
      error('Could not delete %s: %s', term.value, e.message)
    })
  }
}
