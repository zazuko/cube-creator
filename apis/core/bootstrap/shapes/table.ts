import { cc, shape, editor } from '@cube-creator/core/namespace'
import { dash, hydra, rdfs, sh, schema } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'

export const TableShape = turtle`
${shape('table/create')} {
  ${shape('table/create')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${cc.Table} ;
    ${rdfs.label} "Table" ;
    ${sh.property} [
      ${sh.name} "Source CSV file" ;
      ${sh.path} ${cc.csvSource} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.class} ${cc.CSVSource} ;
      ${sh.order} 10 ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Table name" ;
      ${sh.path} ${schema.name} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Identifier template" ;
      ${sh.description} "Used to build a unique identifier for each row of this table. Leave empty to get an auto-generated identifier." ;
      ${sh.path} ${cc.identifierTemplate} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Display color" ;
      ${sh.path} ${schema.color} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 40 ;
      ${dash.editor} ${editor.ColorPicker} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Column mapping" ;
      ${sh.path} ${cc.columnMapping} ;
      ${dash.hidden} ${true} ;
      ${sh.order} 9999 ;
    ] ;
  .
}
`
