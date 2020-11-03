import { cc, shape } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh, dcat, dcterms, schema } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'

export const DatasetShape = turtle`
${shape('dataset/edit-metadata')} {
  ${shape('dataset/edit-metadata')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${dcat.DataSet} ;
    ${rdfs.label} "Cube Metadata" ;
    ${sh.property} [
      ${sh.name} "Title" ;
      ${sh.path} ${dcterms.title} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Description" ;
      ${sh.path} ${dcterms.comment} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Version" ;
      ${sh.path} ${schema.version} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publish on Swiss Open Data" ;
      ${sh.path} ${cc.PublishOnOpendata} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} xsd:boolean
      ${sh.order} 40 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publish on Swiss Open Data" ;
      ${sh.path} ${cc.PublishOnOpendata} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} xsd:boolean
      ${sh.order} 50 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publish on Visualize" ;
      ${sh.path} ${dcterms.publishOnVisualize} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} xsd:boolean
      ${sh.order} 60 ;
    ] ;
    ${sh.property} [
        ${sh.name} "Contact Point" ;
        ${sh.path} ${dcat.contactPoint} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
        ${sh.minLength} 1 ;
        ${sh.order} 70 ;
      ] ;
    ${sh.property} [
      ${sh.name} "Tags" ;
      ${sh.path} ${dcat.keyword} ;
      ${sh.minLength} 1 ;
      ${sh.order} 80 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Creation Date" ;
      ${sh.path} ${dcterms.issued} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} xsd:date
      ${sh.order} 90 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Last Update" ;
      ${sh.path} ${dcterms.modified} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} xsd:date
      ${sh.order} 100 ;
    ] ;    
  .
}
`
