import { cc, shape } from '@cube-creator/core/namespace'
import { turtle } from '@tpluscode/rdf-string'
import { dash, hydra, prov, rdf, rdfs, schema, sh, qudt } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'

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

  ${qudt.NominalScale} ${rdfs.label} "Nominal Scale"@en .
  ${qudt.OrdinalScale} ${rdfs.label} "Ordinal Scale"@en .
  ${qudt.IntervalScale} ${rdfs.label} "Interval Scale"@en .
  ${qudt.RatioScale} ${rdfs.label} "Ratio Scale"@en .
}
`

const managedDimensionCollection = $rdf.namedNode('managed-dimensions/term-sets')

export const ManagedDimensionMappingShape = turtle`
${shape('dimension/managed-mapping')} {
  ${shape('dimension/managed-mapping')}
    a ${sh.NodeShape}, ${hydra.Resource} ;
    ${rdfs.label} "Map original values to managed dimension" ;
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
      ${sh.path} ${cc.managedDimension} ;
      ${sh.name} "Managed dimension" ;
      ${sh.description} "**WARNING!** Changing the selected managed dimension will erase all current mappings" ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${hydra.collection} ${managedDimensionCollection} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.maxCount} 1 ;
      ${sh.order} 10 ;
    ] , [
      ${sh.path} ${prov.hadDictionaryMember} ;
      ${sh.node} _:keyEntityPair ;
      ${sh.name} "Mappings" ;
      ${sh.order} 20 ;
    ]
  .

  _:keyEntityPair
    a ${sh.NodeShape} ;
    ${sh.property} [
      ${sh.path} ${prov.pairKey} ;
      ${sh.name} "Original value" ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
    ] , [
      ${sh.path} ${prov.pairEntity} ;
      ${sh.name} "Managed term" ;
      ${dash.editor} ${dash.InstancesSelectEditor} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${hydra.search} [
        ${hydra.template} "managed-dimensions/terms{?termSet}" ;
        ${hydra.mapping} [
          ${hydra.variable} "termSet" ;
          ${hydra.property} ${cc.managedDimension} ;
          ${hydra.required} true ;
        ] ;
      ]
    ];
  .
}`
