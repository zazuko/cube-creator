import type { Term } from '@rdfjs/types'
import { DELETE } from '@tpluscode/sparql-builder'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders/strict'

export function deleteCurrentError(error: string, dimensionMetadataId: Term) {
  return DELETE`
    graph ?dataset {
      ?dataset ${schema.error} ?currentError .
      ?s ?p ?o
    }
  `.WHERE`
    graph ?dataset {
      ?dataset ${cc.dimensionMetadata} ${dimensionMetadataId} .
      BIND(IRI(CONCAT(STR(?dataset), "#${error}")) as ?currentError)

      ?currentError (<>|!<>)* ?s .
      OPTIONAL { ?s ?p ?o }
    }
  `
}
