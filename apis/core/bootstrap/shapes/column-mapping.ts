import { cc, shape } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh, csvw } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'

export const ColumnMappingShape = turtle`
${shape('column-mapping/create')} {
  ${shape('column-mapping/create')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.ColumnMapping} ;
    ${rdfs.label} "Column Mapping" ;
    ${sh.property} [
      ${sh.name} "Project name" ;
      ${sh.path} ${rdfs.label} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Source Column" ;
      ${sh.path} ${cc.sourceColumn} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${csvw.Column};
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Target Property" ;
      ${sh.path} ${cc.targetProperty} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.order} 30 ;
    ] ;
  .
}
`
