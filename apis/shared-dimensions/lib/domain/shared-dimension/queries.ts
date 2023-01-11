import { NamedNode, Term } from 'rdf-js'
import { DELETE } from '@tpluscode/sparql-builder'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import { md } from '@cube-creator/core/namespace'
import { streamClient } from '../../sparql'

export async function deleteDynamicTerms(dimension: NamedNode, properties: Array<Term>) {
  const values = properties.map(prop => ({ prop }))

  await DELETE`
    ${VALUES(...values)}

    ?term ?prop ?o ; ${md.sharedDimension} ${dimension} .
  `.execute(streamClient.query)
}
