import { NamedNode, Term } from 'rdf-js'
import { DELETE, WITH } from '@tpluscode/sparql-builder'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { schema } from '@tpluscode/rdf-ns-builders/strict'
import { streamClient } from '../../sparql'

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
  `).execute(streamClient.query)
}
