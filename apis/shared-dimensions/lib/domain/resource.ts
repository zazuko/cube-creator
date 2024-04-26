import type { NamedNode, Quad } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { sparql } from '@tpluscode/rdf-string'
import type { AnyPointer, GraphPointer } from 'clownface'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { query } from '@cube-creator/core/namespace'
import { SELECT } from '@tpluscode/sparql-builder'
import { ParsingClient } from 'sparql-http-client/ParsingClient.js'
import { SharedDimensionsStore } from '../store.js'
import { error } from '../log.js'
import env from '../env.js'
import { parsingClient } from '../sparql.js'

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

  const results = await query.execute(client)

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

export function newId(base: string, name: string) {
  if (base.endsWith('/')) {
    return $rdf.namedNode(`${base}${name}`)
  }
  return $rdf.namedNode(`${base}/${name}`)
}

export function replace(from: NamedNode, to: NamedNode) {
  return (quad: Quad) => {
    const subject = quad.subject.equals(from) ? to : quad.subject
    const object = quad.object.equals(from) ? to : quad.object
    return $rdf.quad(subject, quad.predicate, object, quad.graph)
  }
}
