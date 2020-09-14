import { turtle } from '@tpluscode/rdf-string'
import { hydra } from '@tpluscode/rdf-ns-builders'

export const entrypoint = turtle`
<> {
  <> a ${hydra.Resource} ;
    ${hydra.title} "Cube Creator"
}
`
