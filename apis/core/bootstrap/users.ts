import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const users = turtle`
<users> {
  <users> a ${hydra.Collection}, ${cc.UserCollection} ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${schema.Person}
    ] .
}
`
