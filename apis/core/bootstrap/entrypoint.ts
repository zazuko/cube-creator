import { turtle } from '@tpluscode/rdf-string'
import { hydra } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const entrypoint = turtle`
<> {
  <> a ${hydra.Resource}, ${cc.EntryPoint} ;
    ${hydra.title} "Cube Creator" ;
    ${cc.projects} <cube-projects>
}

<observations> {
  <observations> a ${cc.Observations} ;
}
`
