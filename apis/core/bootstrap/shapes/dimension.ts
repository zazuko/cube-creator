import { shape, scale } from '@cube-creator/core/namespace'
import { sparql, turtle } from '@tpluscode/rdf-string'
import { lindasQuery } from '../lib/query'
import { dash, hydra, qudt, rdf, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'

const unitsQuery = sparql`
CONSTRUCT {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?unit .
  ?unit ${rdfs.label} ?name .
} WHERE {
  BIND ( iri('http://app.cube-creator.lndo.site/units') as ?c )

  GRAPH <https://lindas.admin.ch/ontologies> {
    ?unit a <http://qudt.org/schema/qudt/Unit> ;
      ${rdfs.label} ?label .

    OPTIONAL { ?unit ${qudt.ucumCode} ?ucumCode . }

    OPTIONAL { ?unit ${qudt.symbol} ?symbol . }

    BIND(CONCAT(COALESCE(?symbol, ?ucumCode, "?"), " - ", ?label) AS ?name) .
  }
}`

export const DimensionMetadataShape = turtle`
${shape('dimension/metadata')} {
  ${shape('dimension/metadata')}
    a ${sh.NodeShape}, ${hydra.Resource} ;
    ${rdfs.label} "Dimension" ;
    ${sh.property} [
      ${sh.name} "Name" ;
      ${sh.path} ${schema.name} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( "en" "de" "fr" "it" ) ;
      ${sh.uniqueLang} true ;
      ${sh.defaultValue} ""@en ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] , [
      ${sh.name} "Scale of measure" ;
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
      ${sh.name} "Unit" ;
      ${sh.path} ${schema.unit} ;
      ${sh.order} 25 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${qudt.Unit} ;
      ${hydra.collection} ${lindasQuery(unitsQuery)} ;
      ${dash.editor} ${dash.AutoCompleteEditor} ;
    ] , [
      ${sh.name} "Description" ;
      ${sh.path} ${schema.description} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( "en" "de" "fr" "it" ) ;
      ${sh.uniqueLang} true ;
      ${sh.defaultValue} ""@en ;
      ${sh.minLength} 1 ;
      ${dash.singleLine} false ;
      ${sh.order} 30 ;
    ], [
      ${sh.path} ${schema.about} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.hidden} true ;
    ]
  .

  ${scale.Categorical} ${rdfs.label} "Categorical"@en .
  ${scale.Continuous} ${rdfs.label} "Continuous"@en .
  ${scale.Discrete} ${rdfs.label} "Discrete"@en .
  ${scale.Nominal} ${rdfs.label} "Nominal"@en .
  ${scale.Ordinal} ${rdfs.label} "Ordinal"@en .
  ${scale.Numerical} ${rdfs.label} "Numerical"@en .
  ${scale.Spatial} ${rdfs.label} "Spatial"@en .
  ${scale.Temporal} ${rdfs.label} "Temporal"@en .
}
`
