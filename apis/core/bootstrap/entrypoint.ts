import { turtle } from '@tpluscode/rdf-string'
import { dcat, hydra } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import env from '@cube-creator/core/env/node'

export const entrypoint = turtle`
<> {
  <> a ${hydra.Resource}, ${cc.EntryPoint} ;
    ${hydra.title} "Cube Creator" ;
    ${cc.projects} <cube-projects> ;
    ${cc.sharedDimensions} <dimension/> ;
    ${dcat.endpointURL} <${env.PUBLIC_QUERY_ENDPOINT}> ;
}

<observations> {
  <observations> a ${cc.Observations} ;
}
`
