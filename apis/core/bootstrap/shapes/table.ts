import { cc, shape, editor } from '@cube-creator/core/namespace'
import { csvw, dash, hydra, rdfs, sh, schema, xsd } from '@tpluscode/rdf-ns-builders'
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
      ${sh.name} "Observation table?" ;
      ${sh.description} "The observation table defines the structure of the cube" ;
      ${sh.path} ${cc.isObservationTable} ;
      ${sh.datatype} ${xsd.boolean} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.defaultValue} ${false} ;
      ${sh.order} 25 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Identifier template" ;
      ${sh.description} "Used to build a unique identifier for each row of this table. Not supported yet: Leave empty to get an auto-generated identifier." ;
      ${sh.path} ${cc.identifierTemplate} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.pattern} "[\w\d]" ;
      ${sh.defaultValue} "" ;
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
      ${sh.name} "Columns to map" ;
      ${sh.descriptin} "These columns will be mapped in the new table with default parameters that you can change later.";
      ${sh.path} ${csvw.column} ;
      ${sh.class} ${csvw.Column} ;
      ${dash.hidden} ${true} ;
      ${sh.order} 50 ;
    ] ;
  .
}
`
