import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const cubeProjects = turtle`
<cube-project/:project/csv-mapping/source> {
  <cube-project/:project/csv-mapping/source> a ${hydra.Collection}, ${cc.CSVSource} ;
    ${hydra.title} "CSV-Sources" ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${cc.CSVSource}
    ] .
}
`
