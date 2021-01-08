import { cc, shape } from '@cube-creator/core/namespace'
import { dash, dcterms, hydra, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

const cubeIdPattern = $rdf.literal('^[a-zA-Z0-9/\\-._,]+$')

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
      ${sh.name} "Cube identifier" ;
      ${sh.description} "A unique, URL-safe string to identify the cube" ;
      ${sh.path} ${dcterms.identifier} ;
      ${sh.minLength} 1 ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.pattern} ${cubeIdPattern} ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Organization" ;
      ${sh.description} "The owner of the published cube dataset" ;
      ${sh.path} ${schema.maintainer} ;
      ${sh.class} ${schema.Organization} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${hydra.collection} <organizations> ;
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
      ${sh.name} "Cube identifier" ;
      ${sh.description} "A unique, URL-safe string to identify the cube" ;
      ${sh.path} ${dcterms.identifier} ;
      ${sh.minLength} 1 ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.pattern} ${cubeIdPattern} ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Organization" ;
      ${sh.description} "The owner of the published cube dataset" ;
      ${sh.path} ${schema.maintainer} ;
      ${sh.class} ${schema.Organization} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${hydra.collection} <organizations> ;
      ${sh.order} 40 ;
    ] ;
  .
}
`
