import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const cubeProjects = turtle`
<cube-projects> {
  <cube-projects> a ${hydra.Collection}, ${cc.ProjectsCollection} ;
    ${hydra.title} "Cube projects" ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${cc.CubeProject}
    ] .
}
`
