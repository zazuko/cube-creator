import { cc, shape } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'

export const CubeProjectShape = turtle`
${shape('cube-project/create')} {
  ${shape('cube-project/create')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CubeProject} ;
    ${rdfs.label} "Cube Project" ;
    ${sh.property} [
      ${sh.name} "Project name" ;
      ${sh.path} ${rdfs.label} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Start project from" ;
      ${sh.path} ${cc.projectSourceKind} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in} (
        ${shape('cube-project/create#CSV')}
        ${shape('cube-project/create#ExistingCube')}
      ) ;
      ${sh.defaultValue} ${shape('cube-project/create#CSV')} ;
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Cube namespace" ;
      ${sh.description} "A URI that will be used as default prefix for all the custom properties created during the mapping." ;
      ${sh.path} ${cc.namespace} ;
      ${sh.pattern} "[#/]$" ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publish graph" ;
      ${sh.description} "A named graph URI where cubes will be published from this project" ;
      ${sh.path} ${cc.publishGraph} ;
      ${sh.minLength} 1 ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.order} 40 ;
    ] ;
  .

  ${shape('cube-project/create#CSV')}
    ${rdfs.label} "CSV File(s)" ;
    ${rdfs.comment} "Map CSV files to a new Cube" ;
  .

  ${shape('cube-project/create#ExistingCube')}
    ${rdfs.label} "Existing Cube" ;
    ${rdfs.comment} "Add metadata to a Cube resulting of another pipeline" ;
  .
}

${shape('cube-project/update')} {
  ${shape('cube-project/update')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CubeProject} ;
    ${rdfs.label} "Cube Project" ;
    ${sh.property} [
      ${sh.name} "Project name" ;
      ${sh.path} ${rdfs.label} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.path} ${cc.csvMapping} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 20 ;
      ${sh.node} [
        ${sh.property} [
          ${sh.name} "Cube namespace" ;
          ${sh.description} "A URI that will be used as default prefix for all the custom properties created during the mapping." ;
          ${sh.path} ${cc.namespace} ;
          ${sh.pattern} "[#/]$" ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${sh.order} 20 ;
        ]
      ]
    ] ;
  .
}
`
