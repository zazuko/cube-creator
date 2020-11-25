import { cc, editor, shape } from '@cube-creator/core/namespace'
import { dash, hydra, rdfs, sh, csvw, xsd } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

export const ColumnMappingShape = turtle`
${shape('column-mapping/literal')} {
  ${shape('column-mapping/literal')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.LiteralColumnMapping} ;
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
      ${sh.message} "A target property must be an URI or string including only letters, numbers and hyphens" ;
      ${sh.or} (
        [
          ${sh.nodeKind} ${sh.IRI} ;
        ]
        [
          ${sh.nodeKind} ${sh.Literal} ;
          ${sh.datatype} ${xsd.string} ;
          ${sh.pattern} "^[a-zA-Z0-9]+[a-zA-Z0-9-/]*$" ;
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

${shape('column-mapping/reference')} {
  ${shape('column-mapping/reference')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.ReferenceColumnMapping} ;
    ${sh.property} [
      ${sh.name} "Target Property" ;
      ${sh.path} ${cc.targetProperty} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.editor} ${editor.PropertyEditor} ;
      ${sh.message} "A target property must be an URI or string including only letters, numbers and hyphens" ;
      ${sh.or} (
        [
          ${sh.nodeKind} ${sh.IRI} ;
        ]
        [
          ${sh.nodeKind} ${sh.Literal} ;
          ${sh.datatype} ${xsd.string} ;
          ${sh.pattern} "^[a-zA-Z0-9]+[a-zA-Z0-9-/]*$" ;
        ]
      );
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Table" ;
      ${sh.path} ${cc.referencedTable} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.class} ${cc.Table} ;
      ${sh.order} 20 ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Identifier mapping" ;
      ${sh.path} ${cc.identifierMapping} ;
      ${sh.node} ${$rdf.blankNode('identifier-mapping')} ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.order} 30 ;
    ] ;
  .

  ${$rdf.blankNode('identifier-mapping')} a ${sh.NodeShape} ;
    ${sh.property} [
      ${sh.name} "Source CSV column" ;
      ${sh.path} ${cc.sourceColumn} ;
      # Not verifying because columns don't seem to have a stored type
      # ${sh.class} ${csvw.Column} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 10 ;
      ] ;
    ${sh.property} [
      ${sh.name} "Referenced column" ;
      ${sh.path} ${cc.referencedColumn} ;
      # Not verifying because columns don't seem to have a stored type
      # ${sh.class} ${csvw.Column} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 20 ;
    ] ;
  .
}
`
