import { DELETE } from '@tpluscode/sparql-builder'
import { as } from '@tpluscode/rdf-ns-builders/strict'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { ccClients } from '@cube-creator/testing/lib'

export function removeActivities() {
  return DELETE`
      graph ?activity {
        ?s ?p ?o
      }
    `.WHERE`
      graph ?activity {
        ?activity a ?type .
        ?activity ${as.object} ?object .
        ?s ?p ?o .

        FILTER(
          REGEX(str(?object), "^https://cube-creator.lndo.site/cube-project/ubd")
        )

        FILTER(
          ?type ${IN(as.Create, as.Delete, as.Update)}
        )
      }
    `
    .execute(ccClients.parsingClient.query)
}
