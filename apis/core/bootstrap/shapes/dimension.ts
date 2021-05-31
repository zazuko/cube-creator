import { cc, meta, shape, sh1, cube, md } from '@cube-creator/core/namespace'
import { supportedLanguages } from '@cube-creator/core/languages'
import { sparql, turtle } from '@tpluscode/rdf-string'
import { lindasQuery } from '../lib/query'
import { dash, hydra, prov, rdf, rdfs, schema, sh, qudt, time, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import $rdf from 'rdf-ext'
import { placeholderEntity } from '../../lib/domain/dimension-mapping/DimensionMapping'

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
                     ${rdfs.label} ?label .

              OPTIONAL { ?unit  ${qudt.symbol}  ?symbol }
              OPTIONAL { ?unit  ${qudt.ucumCode}  ?ucumCode }
              OPTIONAL { ?unit  ${qudt.expression}  ?expression }

              BIND(concat(?label, " (", coalesce(str(?symbol), str(?ucumCode), str(?expression), "?"), ")") AS ?name)
              BIND(strlen(str(?ucumCode)) AS ?ucumCount)

              FILTER ( lang(?label) = "en" )
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_IMPERIAL} . }
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_USCS} . }
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_PLANCK} . }
            }
        }
      ORDER BY ASC(?ucumCount) ASC(?name)
    }
  }
`

const validateDataKindShape = turtle`[
  ${sh.path} ${meta.dataKind} ;
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
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.uniqueLang} true ;
      ${sh.defaultValue} ""@en ;
      ${sh.minLength} 1 ;
      ${sh.order} 10 ;
    ] , [
      ${sh.name} "Description" ;
      ${sh.path} ${schema.description} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.uniqueLang} true ;
      ${sh.defaultValue} ""@en ;
      ${sh.minLength} 1 ;
      ${dash.singleLine} false ;
      ${sh.order} 15 ;
    ] , [
      ${sh.name} "Dimension type" ;
      ${sh.path} ${rdf.type} ;
      ${sh.in} (
        ${cube.MeasureDimension}
        ${cube.KeyDimension}
      ) ;
      ${sh.maxCount} 1 ;
      ${sh.order} 15 ;
    ], [
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
      ${sh.name} "Data kind" ;
      ${sh.path} ${meta.dataKind} ;
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

  ${cube.MeasureDimension} ${rdfs.label} "Measure dimension"@en .
  ${cube.KeyDimension} ${rdfs.label} "Key dimension"@en .

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

const sharedDimensionCollection = $rdf.namedNode('dimension/_term-sets')

export const SharedDimensionMappingShape = turtle`
${shape('dimension/shared-mapping')} {
  ${shape('dimension/shared-mapping')}
    a ${sh.NodeShape}, ${hydra.Resource} ;
    ${rdfs.label} "Map original values to shared dimension" ;
    ${sh.property} [
      ${sh.path} ${rdf.type} ;
      ${dash.hidden} true ;
      ${sh.hasValue} ${prov.Dictionary} ;
    ] , [
      ${sh.path} ${schema.about} ;
      ${dash.hidden} true ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ] , [
      ${sh.path} ${cc.sharedDimension} ;
      ${sh.name} "Shared dimension" ;
      ${sh.description} "**WARNING!** Changing the selected shared dimension will erase all current mappings" ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${hydra.collection} ${sharedDimensionCollection} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.maxCount} 1 ;
      ${sh.order} 10 ;
    ] , [
      ${sh.path} ${md.onlyValidTerms} ;
      ${sh.name} "Only current terms" ;
      ${sh.description} "Uncheck to show all Shared Terms, including deprecated" ;
      ${sh.datatype} ${xsd.boolean} ;
      ${sh.defaultValue} true ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 15 ;
    ] , [
      ${sh.path} ${prov.hadDictionaryMember} ;
      ${sh.node} _:keyEntityPair ;
      ${sh.name} "Mappings" ;
      ${sh.order} 20 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.class} ${prov.KeyEntityPair} ;
    ] , [
      ${sh.path} ${cc.applyMappings} ;
      ${sh.name} "Apply mappings" ;
      ${sh.description} "If checked, the Cube will be immediately updated with new mappings. Otherwise, running the transformation will be necessary" ;
      ${sh.order} 30 ;
      ${sh.datatype} ${xsd.boolean} ;
      ${sh.defaultValue} false ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ]
  .

  _:keyEntityPair
    a ${sh.NodeShape} ;
    ${sh.property} [
      ${sh.path} ${prov.pairKey} ;
      ${sh.name} "Original value" ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 10 ;
    ] , [
      ${sh.path} ${prov.pairEntity} ;
      ${sh.name} "Shared Dimension term" ;
      ${dash.editor} ${dash.AutoCompleteEditor} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.defaultValue} ${placeholderEntity} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${hydra.search} [
        ${sh.path} [
          ${sh.inversePath} ${prov.hadDictionaryMember} ;
        ] ;
        ${hydra.variableRepresentation} ${hydra.ExplicitRepresentation} ;
        ${hydra.template} "dimension/_terms?dimension={dimension}{&valid}" ;
        ${hydra.mapping} [
          ${hydra.variable} "dimension" ;
          ${hydra.property} ${cc.sharedDimension} ;
          ${hydra.required} true ;
        ] , [
          ${hydra.variable} "valid" ;
          ${hydra.property} ${md.onlyValidTerms} ;
        ];
      ] ;
      ${sh.order} 20 ;
    ];
  .
}`
