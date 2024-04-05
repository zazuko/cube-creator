import type { NamedNode, Term } from '@rdfjs/types'
import { DELETE, WITH } from '@tpluscode/sparql-builder'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { schema } from '@tpluscode/rdf-ns-builders'
import { streamClient } from '../../sparql.js'

interface DeleteDynamicTerms {
  graph: string
  dimension: NamedNode
  properties: Array<Term>
}

export async function deleteDynamicTerms({ dimension, properties, graph }: DeleteDynamicTerms) {
  if (properties.length === 0) {
    return
  }

  const values = properties.map(prop => ({ prop }))

  await WITH(graph, DELETE`
    ?term ?prop ?o .
  `.WHERE`
    ${VALUES(...values)}
    ?term ?prop ?o ; ${schema.inDefinedTermSet} ${dimension} .
  `).execute(streamClient)
}
