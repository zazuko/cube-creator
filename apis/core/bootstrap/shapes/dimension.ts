import { cube, shape, sh1 } from '@cube-creator/core/namespace'
import { sparql, turtle } from '@tpluscode/rdf-string'
import { lindasQuery } from '../lib/query'
import { dash, hydra, rdf, rdfs, schema, sh, qudt, time } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'

const sou = namespace('http://qudt.org/vocab/sou/')

const unitsQuery = sparql`
CONSTRUCT
  {
    ?c a ${hydra.Collection} .
    ?c ${hydra.member} ?unit .
    ?unit ${rdfs.label} ?name .
  }
WHERE
  { BIND(iri("http://app.cube-creator.lndo.site/units") AS ?c)
    { SELECT  ?unit ?name
      WHERE
        { GRAPH <https://lindas.admin.ch/ontologies>
            { ?unit  a ${qudt.Unit} ;
                     ${rdfs.label} ?label ;
                     ${qudt.ucumCode} ?ucumCode.
              OPTIONAL
                { ?unit  ${qudt.symbol}  ?symbol }

              BIND(concat(?label, " (", coalesce(str(?symbol), str(?ucumCode), "?"), ")") AS ?name)
              BIND(strlen(str(?ucumCode)) AS ?ucumCount)

              FILTER ( lang(?label) = "en" )
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_IMPERIAL} . }
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_USCS} . }
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_PLANCK} . }
              FILTER NOT EXISTS {?unit a ${qudt.CurrencyUnit} . }
            }
        }
      ORDER BY ASC(?ucumCount) ASC(?name)
    }
  }
`

const validateDataKindShape = turtle`[
  ${sh.path} ${cube.dataKind} ;
  ${dash.hidden} true ;
  ${sh.maxCount} 1 ;
  ${sh.node} [
    ${sh.xone} (
    [
      ${sh.closed} true ;
      ${sh.property} [
        ${sh.path} ${rdf.type} ;
        ${sh.hasValue} ${schema.GeoCoordinates} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
      ] ;
    ]
    [
      ${sh.closed} true ;
      ${sh.property} [
        ${sh.path} ${rdf.type} ;
        ${sh.hasValue} ${schema.GeoShape} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
      ] ;
    ]
    [
      ${sh.closed} true ;
      ${sh.property} [
        ${sh.path} ${rdf.type} ;
        ${sh.hasValue} ${time.GeneralDateTimeDescription} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
      ] , [
        ${sh.path} ${time.unitType} ;
        ${sh.minCount} 1 ;
        ${sh.maxCount} 1 ;
      ] ;
    ] ) ;
  ] ;
]`

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
      ${sh.path} ${qudt.scaleType} ;
      ${sh.in} (
        ${qudt.NominalScale}
        ${qudt.OrdinalScale}
        ${qudt.IntervalScale}
        ${qudt.RatioScale}
      ) ;
      ${sh.maxCount} 1 ;
      ${sh.order} 20 ;
    ] , [
      ${sh.name} "Unit" ;
      ${sh.path} ${qudt.unit} ;
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
    ] , [
      ${sh.name} "Data kind" ;
      ${sh.path} ${cube.dataKind} ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.BlankNode} ;
      ${sh.node} [
        ${sh.property} [
          ${sh.name} "Choose type" ;
          ${sh.path} ${rdf.type} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${dash.editor} ${dash.EnumSelectEditor} ;
          ${sh.in} (
            ${schema.GeoCoordinates}
            ${schema.GeoShape}
            ${time.GeneralDateTimeDescription}
          ) ;
          ${sh.order} 10 ;
        ] , [
          ${sh.name} "Time precision" ;
          ${sh.path} ${time.unitType} ;
          ${sh.maxCount} 1 ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${sh1.if} [
            ${sh.path} ${rdf.type} ;
            ${sh.hasValue} ${time.GeneralDateTimeDescription} ;
          ] ;
          ${sh.in} (
            ${time.unitYear}
            ${time.unitMonth}
            ${time.unitWeek}
            ${time.unitDay}
            ${time.unitHour}
            ${time.unitMinute}
            ${time.unitSecond}
          ) ;
          ${sh.order} 20 ;
        ] ;
      ] ;
      ${sh.maxCount} 1 ;
      ${sh.order} 40 ;
    ] , [
      ${sh.path} ${schema.about} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.hidden} true ;
    ] ,
    ${validateDataKindShape}
  .

  ${qudt.NominalScale} ${rdfs.label} "Nominal"@en .
  ${qudt.OrdinalScale} ${rdfs.label} "Ordinal"@en .
  ${qudt.IntervalScale} ${rdfs.label} "Interval"@en .
  ${qudt.RatioScale} ${rdfs.label} "Ratio"@en .

  ${schema.GeoCoordinates}
    ${rdfs.label} "Geographic coordinates"@en ;
  .
  ${schema.GeoShape}
    ${rdfs.label} "Geographic shape"@en ;
  .
  ${time.GeneralDateTimeDescription}
    ${rdfs.label} "Time description"@en ;
  .
  ${time.unitYear}
    ${rdfs.label} "Year"@en ;
  .
  ${time.unitMonth}
    ${rdfs.label} "Month"@en ;
  .
  ${time.unitWeek}
    ${rdfs.label} "Week"@en ;
  .
  ${time.unitDay}
    ${rdfs.label} "Day"@en ;
  .
  ${time.unitHour}
    ${rdfs.label} "Hour"@en ;
  .
  ${time.unitMinute}
    ${rdfs.label} "Minute"@en ;
  .
  ${time.unitSecond}
    ${rdfs.label} "Second"@en ;
  .
}
`
