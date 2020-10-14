import { cc } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'

export const CubeProjectShape = turtle`
<shape/cube-project/create> {
  <shape/cube-project/create> a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CubeProject} ;
    ${rdfs.label} "Cube Project" ;
    ${sh.property} [
      ${sh.name} "Project name" ;
      ${sh.path} ${rdfs.label} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 0 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Start project from" ;
      ${sh.path} ${cc.projectSourceKind} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in} (
        <shape/cube-project/create#CSV>
        <shape/cube-project/create#ExistingCube>
      ) ;
      ${sh.order} 1 ;
    ] ;
  .

  <shape/cube-project/create#CSV>
    ${rdfs.label} "CSV File(s)" ;
    ${rdfs.comment} "Map CSV files to a new Cube" ;
  .

  <shape/cube-project/create#ExistingCube>
    ${rdfs.label} "Existing Cube" ;
    ${rdfs.comment} "Add metadata to a Cube resulting of another pipeline" ;
  .
}
`
