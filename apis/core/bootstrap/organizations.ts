import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'

export const organizations = turtle`
<organizations> {
  <organizations> a ${hydra.Collection} ;
    ${hydra.title} "Organizations" ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${schema.Organization}
    ] .
}
`
