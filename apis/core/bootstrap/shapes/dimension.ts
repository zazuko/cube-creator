import { cc, meta, shape, sh1, cube, md, relation, editor } from '@cube-creator/core/namespace'
import { supportedLanguages } from '@cube-creator/core/languages'
import { sparql, turtle } from '@tpluscode/rdf-string'
import { dash, hydra, prov, rdf, rdfs, schema, sh, qudt, time, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'
import $rdf from 'rdf-ext'
import { lindasQueryTemplate } from '../lib/query'

const sou = namespace('http://qudt.org/vocab/sou/')

const sharedDimensionCollection = $rdf.namedNode('dimension/_term-sets')

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
            {
              {
                ?unit a ${qudt.Unit}
              }
              UNION
              {
                ?unit a ${qudt.CurrencyUnit}
              }

              ?unit ${rdfs.label} ?label .

              OPTIONAL { ?unit  ${qudt.symbol}  ?symbol }
              OPTIONAL { ?unit  ${qudt.ucumCode}  ?ucumCode }
              OPTIONAL { ?unit  ${qudt.expression}  ?expression }

              BIND(concat(?label, " (", coalesce(str(?symbol), str(?ucumCode), str(?expression), "?"), ")") AS ?name)
              BIND(strlen(str(?ucumCode)) AS ?ucumCount)

              FILTER ( lang(?label) = "en" )
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_IMPERIAL} . }
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_USCS} . }
              FILTER NOT EXISTS {?unit ${qudt.unitOfSystem} ${sou.SOU_PLANCK} . }

              FILTER(REGEX(?name, "_NAME_", "i"))
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
  ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
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
      ${sh.maxCount} ${supportedLanguages.length};
      ${sh.minLength} 1 ;
      ${sh.order} 5 ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ] , [
      ${sh.name} "Description" ;
      ${sh.path} ${schema.description} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.uniqueLang} true ;
      ${sh.maxCount} ${supportedLanguages.length};
      ${sh.minLength} 1 ;
      ${dash.singleLine} false ;
      ${sh.order} 10 ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ] , [
      ${sh.name} "Dimension type" ;
      ${sh.description} "See the [documentation](https://github.com/zazuko/cube-creator/wiki/3.-Cube-Designer#dimension-type) for details." ;
      ${sh.path} ${rdf.type} ;
      ${sh.in} (
        ${cube.MeasureDimension}
        ${cube.KeyDimension}
      ) ;
      ${sh.maxCount} 1 ;
      ${sh.order} 15 ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ], [
      ${sh.name} "Scale of measure" ;
      ${sh.description} "See the [documentation](https://github.com/zazuko/cube-creator/wiki/3.-Cube-Designer#scale-of-measure) for details." ;
      ${sh.path} ${qudt.scaleType} ;
      ${sh.in} (
        ${qudt.NominalScale}
        ${qudt.OrdinalScale}
        ${qudt.IntervalScale}
        ${qudt.RatioScale}
      ) ;
      ${sh.maxCount} 1 ;
      ${sh.order} 20 ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ] , [
      ${sh.name} "Unit" ;
      ${sh.description} "Please also choose Number or Percent were applicable for Unit less dimensions. See the [documentation](https://github.com/zazuko/cube-creator/wiki/3.-Cube-Designer#dimension-type) for details." ;
      ${sh.path} ${qudt.unit} ;
      ${sh.order} 25 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${qudt.Unit} ;
      ${hydra.search} [
        ${hydra.template} "${lindasQueryTemplate(unitsQuery, 'NAME')}" ;
        ${hydra.mapping} [
          ${hydra.property} ${hydra.freetextQuery} ;
          ${hydra.variable} "NAME" ;
          ${sh.minLength} 3 ;
        ] ;
      ] ;
      ${dash.editor} ${dash.AutoCompleteEditor} ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ] , [
      ${sh.name} "Data kind" ;
      ${sh.description} "See the [documentation](https://github.com/zazuko/cube-creator/wiki/3.-Cube-Designer#data-kind) for details." ;
      ${sh.path} ${meta.dataKind} ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.BlankNode} ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
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
      ${sh.name} "Relation to another dimension" ;
      ${sh.path} ${meta.dimensionRelation} ;
      ${sh.nodeKind} ${sh.BlankNode} ;
      ${sh.order} 60 ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
      ${sh.node} [
        ${sh.property} [
          ${sh.name} "Type" ;
          ${sh.path} ${rdf.type} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${sh.in} (
            ${relation.StandardError}
            ${relation.StandardError1SD}
            ${relation.StandardError2SD}
            ${relation.StandardError3SD}
            ${relation.StandardDeviation}
          ) ;
          ${dash.editor} ${dash.EnumSelectEditor} ;
          ${sh.order} 10 ;
        ] , [
          ${sh.name} "Target dimension" ;
          ${sh.path} ${meta.relatesTo} ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${dash.editor} ${dash.EnumSelectEditor} ;
          ${sh.order} 20 ;
        ] ;
      ] ;
    ] ,
    [
      ${sh.name} "Order" ;
      ${sh.description} "An optional order which can be used to enforce an order of the dimensions for visualizations (e.g. in a table). Needs to be a numerical order." ;
      ${sh.path} ${sh.order} ;
      ${sh.datatype} ${xsd.integer} ;
      ${sh.minCount} 0 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 50 ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ] , [
      ${sh.path} ${schema.about} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.hidden} true ;
      ${sh.group} ${shape('dimension/metadata#coreGroup')} ;
    ] , [
      ${sh.name} "Hierarchy" ;
      ${sh.path} ${meta.inHierarchy} ;
      ${sh.group} ${shape('dimension/metadata#hierarchyGroup')} ;
      ${sh.class} ${meta.Hierarchy} ;
      ${sh.nodeKind} ${sh.BlankNode} ;
      ${sh.maxCount} 1 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} [
        ${sh.property} [
          ${sh.name} "Copy from" ;
          ${sh.path} ${schema.isBasedOn} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${sh.description} "Select a hierarchy to use as base" ;
          ${dash.editor} ${dash.AutoCompleteEditor} ;
          ${hydra.search} [
            ${hydra.template} "/dimension/_hierarchies{?q}" ;
            ${hydra.mapping} [
              ${hydra.variable} "q" ;
              ${hydra.property} ${hydra.freetextQuery} ;
              ${sh.minLength} 0 ;
            ] ;
          ] ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${sh.order} 0 ;
        ] , [
          ${sh.name} "Name" ;
          ${dash.readOnly} true ;
          ${sh.path} ${schema.name} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${dash.hidden} true ;
          ${sh.order} 1 ;
        ] , [
          ${sh.name} "Root dimension" ;
          ${dash.readOnly} true ;
          ${sh.path} ${md.sharedDimension} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${dash.editor} ${dash.LabelViewer} ;
          ${sh.order} 2 ;
          ${sh1.hideWithoutObjects} true ;
        ] , [
          ${sh.name} "Root" ;
          ${sh.path} ${meta.hierarchyRoot} ;
          ${dash.readOnly} true ;
          ${sh.minCount} 1 ;
          ${sh.nodeKind} ${sh.IRI} ;
          ${dash.editor} ${dash.LabelViewer} ;
          ${sh.order} 3 ;
          ${sh1.hideWithoutObjects} true ;
        ] , [
          ${sh.name} "Next level" ;
          ${sh.path} ${meta.nextInHierarchy} ;
          ${sh.minCount} 1 ;
          ${sh.maxCount} 1 ;
          ${sh.nodeKind} ${sh.BlankNode} ;
          ${dash.editor} ${dash.DetailsEditor} ;
          ${sh.node} _:NextInHierarchyShape ;
          ${sh.order} 4 ;
          ${sh1.hideWithoutObjects} true ;
          ${dash.readOnly} true ;
        ], [
          ${sh.path} ${rdf.type} ;
          ${sh.hasValue} ${meta.Hierarchy} ;
          ${sh.maxCount} 1 ;
          ${dash.hidden} true ;
        ]  ;
      ] ;
      ${sh.order} 20 ;
    ] ,
    ${validateDataKindShape}
  .

  _:NextInHierarchyShape
    a ${sh.NodeShape} ;
    ${sh.property} [
      ${sh.name} "Name" ;
      ${sh.path} ${schema.name} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.string} ;
      ${dash.readOnly} true ;
      ${sh1.hideWithoutObjects} true ;
      ${sh.order} 1 ;
    ] , [
      ${sh.name} "Type" ;
      ${sh.path} ${sh.targetClass} ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${dash.readOnly} true ;
      ${sh1.hideWithoutObjects} true ;
      ${sh.order} 2 ;
    ] , [
      ${sh.name} "Property" ;
      ${sh.path} ${sh.path} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${dash.readOnly} true ;
      ${sh1.hideWithoutObjects} true ;
      ${sh.order} 3 ;
      ${dash.editor} ${editor.HierarchyPropertyViewer} ;
      ${sh.node} [
        ${sh.xone} (
          [ ${sh.nodeKind} ${sh.IRI} ]
          [
            ${sh.nodeKind} ${sh.BlankNode} ;
            ${sh.property} [
              ${sh.path} ${sh.inversePath} ;
              ${sh.nodeKind} ${sh.IRI} ;
              ${sh.minCount} 1 ;
              ${sh.maxCount} 1 ;
            ] ;
          ]
        )
      ];
    ] , [
      ${sh.name} "Next level" ;
      ${sh.path} ${meta.nextInHierarchy} ;
      ${dash.readOnly} true ;
      ${sh1.hideWithoutObjects} true ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.BlankNode} ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} _:NextInHierarchyShape ;
      ${sh.order} 4 ;
    ] ;
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

  ${relation.StandardError} a ${meta.DimensionRelation} ;
    ${schema.name} "Standard Error"@en ;
    ${schema.description} "The standard error is the standard deviation of its sampling distribution or an estimate of that standard deviation."@en ;
    ${schema.about} <http://www.wikidata.org/entity/Q12483> ;
    ${schema.sameAs} <http://www.wikidata.org/entity/Q620994> ;
  .

  ${relation.StandardError1SD} a ${meta.DimensionRelation} ;
    ${rdfs.subClassOf} ${relation.StandardError} ;
    ${schema.name} "Standard Error with one Standard Deviation."@en ;
    ${schema.alternateName} "SE" ;
  .

  ${relation.StandardError2SD} a ${meta.DimensionRelation} ;
    ${schema.name} "Standard Error with two Standard Deviation."@en ;
    ${schema.alternateName} "2SE" ;
  .

  ${relation.StandardError3SD} a ${meta.DimensionRelation} ;
    ${schema.name} "Standard Error with three Standard Deviation."@en ;
    ${schema.alternateName} "3SE" ;
  .

  ${relation.StandardDeviation} a ${meta.DimensionRelation} ;
    ${schema.name} "Standard Deviation"@en ;
    ${schema.description} "Dispersion of the values of a random variable around its expected value."@en ;
    ${schema.about} <http://www.wikidata.org/entity/Q12483> ;
    ${schema.sameAs} <http://www.wikidata.org/entity/Q159375> ;
  .

  ${shape('dimension/metadata#coreGroup')}
    ${rdfs.label} "Metadata" ;
    ${sh.order} 1 .
  ${shape('dimension/metadata#hierarchyGroup')}
    ${rdfs.label} "Hierarchy" ;
    ${sh.order} 2 .
}
`

export const SharedDimensionMappingImportShape = turtle`
${shape('dimension/shared-mapping-import')} {
  ${shape('dimension/shared-mapping-import')}
    a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.property} [
      ${sh.path} ${cc.sharedDimension} ;
      ${sh.name} "Shared dimension" ;
      ${dash.editor} ${dash.AutoCompleteEditor} ;
      ${hydra.collection} ${sharedDimensionCollection} ;
      ${sh1.orderBy} ( ${schema.name} ) ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.order} 10 ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ] , [
      ${sh.path} ${rdf.predicate} ;
      ${sh.name} "Identifier property" ;
      ${sh.description} """Value of this property can be directly on the Shared Term or inside a \`schema:PropertyValue\` such as \`schema:identifier [ schema:value "ID" ] \`""" ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.defaultValue} ${schema.identifier} ;
      ${dash.editor} ${editor.PropertyEditor} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.order} 20 ;
    ] , [
      ${sh.path} ${md.onlyValidTerms} ;
      ${sh.name} "Only current terms" ;
      ${sh.description} "Uncheck to import all Shared Terms, including deprecated" ;
      ${sh.datatype} ${xsd.boolean} ;
      ${sh.defaultValue} true ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 30 ;
    ]  ;
  .
}
`

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
      ${sh.name} "Shared dimensions" ;
      ${dash.editor} ${dash.AutoCompleteEditor} ;
      ${hydra.collection} ${sharedDimensionCollection} ;
      ${sh1.orderBy} ( ${schema.name} ) ;
      ${sh.nodeKind} ${sh.IRI} ;
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
      ${sh.description} "New mappings will only be applied after transformation is ran" ;
      ${sh.order} 20 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.class} ${prov.KeyEntityPair} ;
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
      ${sh1.minCount} 1 ; # sh1:minCount will be changed into sh:minCount in the client to force a dropdown being rendered
      ${sh.maxCount} 1 ;
      ${sh1.itemHelptextPath} ( ${schema.inDefinedTermSet} ${schema.name} ) ;
      ${hydra.search} [
        ${sh.path} [
          ${sh.inversePath} ${prov.hadDictionaryMember} ;
        ] ;
        ${hydra.variableRepresentation} ${hydra.ExplicitRepresentation} ;
        ${hydra.template} "dimension/_terms?dimension={dimension}{&valid,q}" ;
        ${hydra.mapping} [
          ${hydra.variable} "dimension" ;
          ${hydra.property} ${cc.sharedDimension} ;
          ${hydra.required} true ;
        ] , [
          ${hydra.variable} "valid" ;
          ${hydra.property} ${md.onlyValidTerms} ;
        ] , [
          ${hydra.variable} "q" ;
          ${hydra.property} ${hydra.freetextQuery} ;
          ${sh.minLength} 0 ;
        ];
      ] ;
      ${sh.order} 20 ;
    ];
  .
}`
