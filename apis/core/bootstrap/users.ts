import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'

export const users = turtle`
<users> {
  <users> a ${hydra.Collection} ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${schema.Person}
    ] .
}
`
