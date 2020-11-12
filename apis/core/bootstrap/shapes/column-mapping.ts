import { cc, editor, shape } from '@cube-creator/core/namespace'
import { dash, hydra, rdfs, sh, csvw, xsd } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'

export const ColumnMappingShape = turtle`
${shape('column-mapping/create')} {
  ${shape('column-mapping/create')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.ColumnMapping} ;
    ${rdfs.label} "Column Mapping" ;
    ${sh.property} [
      ${sh.name} "Source Column" ;
      ${sh.path} ${cc.sourceColumn} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.class} ${csvw.Column};
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Target Property" ;
      ${sh.path} ${cc.targetProperty} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.editor} ${editor.PropertyEditor} ;
      ${sh.or} (
        [
          ${sh.nodeKind} ${sh.IRI} ;
        ]
        [
          ${sh.nodeKind} ${sh.Literal} ;
          ${sh.datatype} ${xsd.string} ;
        ]
      );
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Data type" ;
      ${sh.path} ${cc.datatype} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in} (
        ${xsd.date}
        ${xsd.dateTime}
        ${xsd.decimal}
        ${xsd.float}
        ${xsd.int}
        ${xsd.string}
      ) ;
      ${sh.order} 40 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Language" ;
      ${sh.path} ${cc.language} ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.in} ("de" "en" "fr" "it") ;
      ${sh.order} 50 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Default value" ;
      ${sh.path} ${cc.defaultValue} ;
      ${sh.maxCount} 1 ;
      ${sh.order} 60 ;
    ] ;
  .

  ${xsd.string} ${rdfs.label} "string" .
  ${xsd.int} ${rdfs.label} "int" .
  ${xsd.float} ${rdfs.label} "float" .
  ${xsd.decimal} ${rdfs.label} "decimal" .
  ${xsd.date} ${rdfs.label} "date" .
  ${xsd.dateTime} ${rdfs.label} "datetime" .
}
`
