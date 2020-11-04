import { cc, shape } from '@cube-creator/core/namespace'
import { csvw, dash, hydra, rdfs, schema, sh, xsd } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

export const CSVSourceShape = turtle`
${shape('csv-source/update')} {
  ${shape('csv-source/update')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.CSVSource} ;
    ${rdfs.label} "CSV source file" ;
    ${sh.property} [
      ${sh.name} "CSV dialect options" ;
      ${sh.path} ${csvw.dialect} ;
      ${sh.node} ${$rdf.blankNode('csv-source-dialect')} ;
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
    ] ;
  .

  ${$rdf.blankNode('csv-source-dialect')} a ${sh.NodeShape} ;
    ${rdfs.label} "CSV dialect options" ;
    ${sh.property} [
      ${sh.name} "Delimiter" ;
      ${sh.path} ${csvw.delimiter} ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Quote char" ;
      ${sh.path} ${csvw.quoteChar} ;
      ${sh.datatype} ${xsd.string} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Header rows" ;
      ${sh.path} ${csvw.headerRowCount} ;
      ${sh.datatype} ${xsd.integer} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.default} 1 ;
      ${sh.minInclusive} 0 ;
      ${sh.order} 30 ;
    ] ;
  .
}
`
