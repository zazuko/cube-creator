import { cc, cube, editor, shape } from '@cube-creator/core/namespace'
import { supportedLanguages } from '@cube-creator/core/languages'
import { datatypes } from '@cube-creator/core/datatypes'
import { dash, hydra, rdfs, sh, csvw, xsd } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

const literalShapeId = shape('column-mapping/literal')
const referenceShapeId = shape('column-mapping/reference')
const identifierMappingId = $rdf.namedNode(referenceShapeId.value + '#identifierMapping')

const keyOrMeasureDimension = turtle`
  ${sh.property} [
    ${sh.name} "Dimension type" ;
    ${sh.path} ${cc.dimensionType} ;
    ${sh.in} (
      ${cube.MeasureDimension}
      ${cube.KeyDimension}
    ) ;
    ${sh.maxCount} 1 ;
    ${sh.order} 70 ;
  ] ;
`

const dimensionTypes = turtle`
  ${cube.MeasureDimension} ${rdfs.label} "Measure dimension"@en .
  ${cube.KeyDimension} ${rdfs.label} "Key dimension"@en .`

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
      ${sh.defaultValue} ${xsd.string} ;
      ${sh.in} (
        ${datatypes.map(([id]) => id)}
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

  ${datatypes.map(([id, labels]) => labels.map(label => turtle`${id} ${rdfs.label} "${label}" .`))}

  ${dimensionTypes}
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
    ${keyOrMeasureDimension}
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

  ${dimensionTypes}
}
`
