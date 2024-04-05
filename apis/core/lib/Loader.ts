import type { NamedNode } from '@rdfjs/types'
import { SparqlQueryLoader } from '@hydrofoil/labyrinth/lib/loader'
import { PropertyResource, Resource } from 'hydra-box'
import ParsingClient from 'sparql-http-client/ParsingClient.js'
import { SELECT } from '@tpluscode/sparql-builder'
import $rdf from '@zazuko/env'
import { as, hydra } from '@tpluscode/rdf-ns-builders'
import { IN, VALUES } from '@tpluscode/sparql-builder/expressions'
import express from 'express'

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
  async forPropertyOperation(...args: any[]): Promise<PropertyResource[]> {
    const [term, req] = args as [NamedNode, express.Request]

    const client: ParsingClient = (this as any).__client
    const createDatasetGetters: CreateResourceGetters = (this as any).__createDatasetGetters.bind(this)
    const supportedProperties = $rdf.clownface(req.hydra.api)
      .any()
      .has(hydra.supportedProperty)
      .out(hydra.supportedProperty)
      .out(hydra.property)
      .map(({ term }) => ({ link: term }))

    const links = await SELECT`?parent ?link`
      .WHERE`
        ${VALUES(...supportedProperties)}

        graph ?parent {
          ?parent ?link ${term} .

          FILTER (?link NOT ${IN(...excludedProperties)})
        }
      `.execute(client)

    const resources = links.reduce((set, { parent, link }) => {
      if (parent.termType !== 'NamedNode' || link.termType !== 'NamedNode') {
        return set
      }

      const resource = set.get(parent) || {
        term: parent,
        property: link,
        object: term,
        prefetchDataset: $rdf.dataset(),
        types: $rdf.termSet(),
        ...createDatasetGetters(parent),
      }

      resource.prefetchDataset.add($rdf.quad(parent, link, term))

      return set.set(parent, resource)
    }, $rdf.termMap<NamedNode, PropertyResource>())

    if (resources.size) {
      const typesQuery = [...resources.keys()].reduce((query, graph) => {
        return query.FROM().NAMED(graph)
      }, SELECT`?parent ?type`
        .WHERE`
          graph ?parent {
            ?parent a ?type
          }
        `)

      const types = await typesQuery.execute(client)
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
    }

    return [...resources.values()]
  }
}
