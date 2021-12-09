import { SparqlQueryLoader } from '@hydrofoil/labyrinth/lib/loader'
import { NamedNode } from 'rdf-js'
import { PropertyResource, Resource } from 'hydra-box'
import ParsingClient from 'sparql-http-client/ParsingClient'
import { SELECT } from '@tpluscode/sparql-builder'
import $rdf from 'rdf-ext'
import TermSet from '@rdfjs/term-set'
import TermMap from '@rdfjs/term-map'
import { as } from '@tpluscode/rdf-ns-builders/strict'
import { IN } from '@tpluscode/sparql-builder/expressions'

interface CreateResourceGetters {
  (term: NamedNode): Pick<Resource, 'dataset' | 'quadStream'>
}

/**
 * Lists properties which should not be considered as supported links
 *
 * It would be better to find those directly from the hydra ApiDocumentation but it's not reachable in this context
 */
const excludedProperties = [as.object]

export default class Loader extends SparqlQueryLoader {
  async forPropertyOperation(term: NamedNode): Promise<PropertyResource[]> {
    const client: ParsingClient = (this as any).__client
    const createDatasetGetters: CreateResourceGetters = (this as any).__createDatasetGetters.bind(this)

    const links = await SELECT`?parent ?link`
      .WHERE`
        graph ?parent {
          ?parent ?link ${term} .

          FILTER (?link NOT ${IN(...excludedProperties)})
        }
      `.execute(client.query)

    const resources = links.reduce((set, { parent, link }) => {
      if (parent.termType !== 'NamedNode' || link.termType !== 'NamedNode') {
        return set
      }

      const resource = set.get(parent) || {
        term: parent,
        property: link,
        object: term,
        prefetchDataset: $rdf.dataset(),
        types: new TermSet(),
        ...createDatasetGetters(parent),
      }

      resource.prefetchDataset.add($rdf.quad(parent, link, term))

      return set.set(parent, resource)
    }, new TermMap<NamedNode, PropertyResource>())

    const typesQuery = [...resources.keys()].reduce((query, graph) => {
      return query.FROM().NAMED(graph)
    }, SELECT`?parent ?type`
      .WHERE`
        graph ?parent {
          ?parent a ?type
        }
      `)

    const types = await typesQuery.execute(client.query)
    for (const { parent, type } of types) {
      if (parent.termType !== 'NamedNode' || type.termType !== 'NamedNode') {
        continue
      }
      const resource = resources.get(parent)
      resource?.types.add(type)
      if (type.termType === 'NamedNode') {
        resource?.types.add(type)
      }
    }

    return [...resources.values()]
  }
}
