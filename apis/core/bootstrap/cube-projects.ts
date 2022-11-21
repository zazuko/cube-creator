import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { Draft, Published } from '@cube-creator/model/Cube'

export const cubeProjects = turtle`
<cube-projects> {
  <cube-projects> a ${hydra.Collection}, ${cc.ProjectsCollection} ;
    ${hydra.title} "Cube projects" ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${cc.CubeProject}
    ] .
}

<cube-projects/status> {
  <cube-projects/status> a ${hydra.Collection}, ${schema.DefinedTermSet} ;
    ${hydra.member} ${Draft}, ${Published} ;
  .

  ${Published} a ${schema.DefinedTerm} ;
    ${rdfs.label} "Published" .

  ${Draft} a ${schema.DefinedTerm} ;
    ${rdfs.label} "Draft" .
}
`
