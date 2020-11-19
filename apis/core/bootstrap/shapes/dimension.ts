import { shape, scale } from '@cube-creator/core/namespace'
import { turtle } from '@tpluscode/rdf-string'
import { dash, hydra, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'

export const DimensionMetadataShape = turtle`
${shape('dimension/metadata')} {
  ${shape('dimension/metadata')}
    a ${sh.NodeShape}, ${hydra.Resource} ;
    ${rdfs.label} "Dimension" ;
    ${sh.property} [
      ${sh.path} ${schema.name} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( "en" "de" "fr" "it" ) ;
      ${sh.uniqueLang} true ;
      ${sh.defaultValue} "" ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] , [
      ${sh.path} ${scale.scaleOfMeasure} ;
      ${sh.in} (
        ${scale.Categorical}
        ${scale.Continuous}
        ${scale.Discrete}
        ${scale.Nominal}
        ${scale.Ordinal}
        ${scale.Numerical}
        ${scale.Spatial}
        ${scale.Temporal}
      ) ;
      ${sh.maxCount} 1 ;
      ${sh.order} 20 ;
    ] , [
      ${sh.path} ${schema.about} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.hidden} true ;
    ]
  .
}
`
