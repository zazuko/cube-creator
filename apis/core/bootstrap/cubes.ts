import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { cube } from '@cube-creator/core/namespace'

export const cubes = turtle`
<cubes> {
  <cubes> a ${hydra.Collection} ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${cube.Cube}
    ] .
}
`
