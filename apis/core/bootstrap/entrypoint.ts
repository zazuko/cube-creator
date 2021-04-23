import { turtle } from '@tpluscode/rdf-string'
import { hydra } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import env from '@cube-creator/shared-dimensions-api/lib/env'

export const entrypoint = turtle`
<> {
  <> a ${hydra.Resource}, ${cc.EntryPoint} ;
    ${hydra.title} "Cube Creator" ;
    ${cc.projects} <cube-projects> ;
    ${cc.sharedDimensions} <${env.MANAGED_DIMENSIONS_API_BASE}> ;
}

<observations> {
  <observations> a ${cc.Observations} ;
}
`
