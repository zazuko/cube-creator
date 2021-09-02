import { CONSTRUCT } from '@tpluscode/sparql-builder'
import StreamClient from 'sparql-http-client'
import { csvw } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'

export async function loadCube({ endpoint, user, password }) {
  const query = CONSTRUCT`?s ?p ?o`
    .FROM($rdf.namedNode('https://pipelines-test.lindas.admin.ch/cube-project/ch-bafu-wald-faostat-prod-test002-xxqnddvzz4b/cube-data'))
    .WHERE`
      ?s ?p ?o
      filter (?p != ${csvw.describes})
    `

  return query.execute(new StreamClient({
    endpointUrl: endpoint,
    user,
    password,
  }).query)
}
