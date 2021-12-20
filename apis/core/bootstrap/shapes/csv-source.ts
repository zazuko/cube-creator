import { cc, shape } from '@cube-creator/core/namespace'
import { csvw, dash, hydra, rdf, rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

const shapeCreateId = shape('csv-source/create')
const shapeUpdateId = shape('csv-source/update')
const csvSourceDialect = $rdf.namedNode(shapeUpdateId.value + '#csvSourceDialect')

export const CSVSourceCreateShape = turtle`
${shapeCreateId} {
  ${shapeCreateId} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${schema.MediaObject} ;
    ${rdfs.label} "CSV Source Media Object" ;
    ${sh.property} [
      ${sh.name} "Source type" ;
      ${sh.path} ${cc.sourceKind} ;
      ${sh.in} ( ${cc.MediaLocal} ${cc.MediaURL} ) ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ] ;
    ${sh.property} [
      ${sh.name} "File name" ;
      ${sh.path} ${schema.name} ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ] ;
    ${sh.xone} (
      [
        ${sh.closed} true ;
        ${sh.ignoredProperties} (
          ${cc.sourceKind}
          ${schema.name}
          ${rdf.type}
        ) ;
        ${sh.property} [
          ${sh.path} ${cc.sourceKind} ;
          ${sh.hasValue} ${cc.MediaLocal} ;
          ${dash.hidden} true ;
        ] ;
        ${sh.property} [
          ${sh.name} "S3 key" ;
          ${sh.path} ${schema.identifier} ;
          ${sh.datatype} ${xsd.string} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
        ] ;
      ]
      [
        ${sh.closed} true ;
        ${sh.ignoredProperties} (
          ${cc.sourceKind}
          ${schema.name}
          ${rdf.type}
        ) ;
        ${sh.property} [
          ${sh.path} ${cc.sourceKind} ;
          ${sh.hasValue} ${cc.MediaURL} ;
          ${dash.hidden} true ;
        ] ;
        ${sh.property} [
          ${sh.name} "File location URL" ;
          ${sh.path} ${schema.contentUrl} ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
        ] ;
      ]
    ) ;
  .
}
`

export const CSVSourceUpdateShape = turtle`
${shapeUpdateId} {
  ${shapeUpdateId} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CSVSource} ;
    ${rdfs.label} "CSV source file" ;
    ${sh.property} [
      ${sh.name} "CSV dialect options" ;
      ${sh.path} ${csvw.dialect} ;
      ${sh.node} ${csvSourceDialect} ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 0 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Source name" ;
      ${sh.path} ${schema.name} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${xsd.string} ;
      ${dash.hidden} ${true} ;
    ] ;
  .

  ${csvSourceDialect} a ${sh.NodeShape} ;
    ${rdfs.label} "CSV dialect options" ;
    ${sh.property} [
      ${sh.name} "Delimiter" ;
      ${sh.path} ${csvw.delimiter} ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Quote char" ;
      ${sh.path} ${csvw.quoteChar} ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 20 ;
    ] ;
  .
}
`
