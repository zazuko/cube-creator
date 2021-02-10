import { cc, editor, shape } from '@cube-creator/core/namespace'
import { supportedLanguages } from '@cube-creator/model/languages'
import { dash, hydra, rdfs, sh, csvw, xsd } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

const literalShapeId = shape('column-mapping/literal')
const referenceShapeId = shape('column-mapping/reference')
const identifierMappingId = $rdf.namedNode(referenceShapeId.value + '#identifierMapping')

export const ColumnMappingShape = turtle`
${literalShapeId} {
  ${literalShapeId} a ${sh.NodeShape}, ${hydra.Resource} ;
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
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in} (
        # Most used datatypes, in alphabetical order of the label
        ${xsd.string}
        ${xsd.boolean}
        ${xsd.int}
        ${xsd.decimal}
        ${xsd.time}
        ${xsd.date}
        ${xsd.dateTime}
        # ${xsd.float}
        # Less used datatypes, in alphabetical order of the label
        ${xsd.gDay}
        # ${xsd.duration}
        # ${xsd.dayTimeDuration}
        # ${xsd.yearhMonthDuration}
        ${xsd.gMonth}
        #${xsd.gMonthDay}
        ${xsd.gYear}
        #${xsd.gYearMonth}
      ) ;
      ${sh.order} 40 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Language" ;
      ${sh.path} ${cc.language} ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.in} ( ${supportedLanguages} ) ;
      ${sh.order} 50 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Default value" ;
      ${sh.path} ${cc.defaultValue} ;
      ${sh.maxCount} 1 ;
      ${sh.order} 60 ;
    ] ;
  .

  ${xsd.boolean} ${rdfs.label} "boolean" .
  ${xsd.date} ${rdfs.label} "date" .
  ${xsd.dateTime} ${rdfs.label} "datetime" .
  ${xsd.decimal} ${rdfs.label} "decimal" .
#  ${xsd.float} ${rdfs.label} "float" .
  ${xsd.int} ${rdfs.label} "int" .
  ${xsd.string} ${rdfs.label} "string" .
  ${xsd.gDay} ${rdfs.label} "day" .
#  ${xsd.duration} ${rdfs.label} "duration" .
#  ${xsd.dayTimeDuration} ${rdfs.label} "duration (day+time)" .
#  ${xsd.yearhMonthDuration} ${rdfs.label} "duration (year+month)" .
  ${xsd.gMonth} ${rdfs.label} "month" .
#  ${xsd.gMonthDay} ${rdfs.label} "month+day" .
  ${xsd.time} ${rdfs.label} "time" .
  ${xsd.gYear} ${rdfs.label} "year" .
#  ${xsd.gYearMonth} ${rdfs.label} "year+month" .
}

${referenceShapeId} {
  ${referenceShapeId} a ${sh.NodeShape}, ${hydra.Resource} ;
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
      ${sh.node} ${identifierMappingId} ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.order} 30 ;
    ] ;
  .

  ${identifierMappingId} a ${sh.NodeShape} ;
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
