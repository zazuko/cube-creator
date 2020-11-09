import { cc, shape, freq } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh, dcat, dcterms, xsd, rdf, vcard, schema, _void, dash } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

export const DatasetShape = turtle`
${shape('dataset/edit-metadata')} {
  ${shape('dataset/edit-metadata')} a ${sh.NodeShape}, ${hydra.Resource} ;
    ${sh.targetClass} ${_void.Dataset} ;
    ${rdfs.label} "Cube Metadata" ;
    ${sh.property} [
      ${sh.name} "Identifier" ;
      ${sh.path} ${dcterms.identifier} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 0 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Title" ;
      ${sh.path} ${dcterms.title} ;
      ${sh.minCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ("en" "de" "fr" "it") ;
      ${sh.uniqueLang} true ;
      ${sh.order} 10 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Description" ;
      ${sh.path} ${dcterms.comment} ;
      ${sh.minCount} 0 ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ("en" "de" "fr" "it") ;
      ${sh.uniqueLang} true ;
      ${sh.order} 20 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Status" ;
      ${sh.path} ${schema.creativeWorkStatus} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.in} ("Draft" "Published") ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publish on Swiss Open Data" ;
      ${sh.path} ${cc.publishOnOpendata} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.boolean} ;
      ${sh.order} 40 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publish on Visualize" ;
      ${sh.path} ${cc.publishOnVisualize} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.boolean} ;
      ${sh.order} 50 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Data refresh interval" ;
      ${sh.path} ${dcterms.accrualPeriodicity} ;
      ${sh.minCount} 0 ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${dcterms.PeriodOfTime} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in} 
        ( ${freq.triennal} 
          ${freq.biennal} 
          ${freq.annual} 
          ${freq.semiannual} 
          ${freq.quarterly} 
          ${freq.monthly}
          ${freq.weekly}
          ${freq.daily} 
          ${freq.irregular} ) ;
      ${sh.order} 60 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Data period" ;
      ${sh.path} ${dcterms.temporal} ;
      ${sh.minCount} 1 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} ${$rdf.blankNode('temporal-from-to')} ;
      ${sh.order} 70 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Publisher" ;
      ${sh.path} ${dcterms.publisher} ;
      ${sh.minCount} 0 ;
      ${sh.datatype} ${rdf.Description} ;
      ${sh.order} 80 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Contact Point" ;
      ${sh.path} ${dcat.contactPoint} ;
      ${sh.minCount} 1 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} ${$rdf.blankNode('vcard-organization')} ;
      ${sh.order} 90 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Theme" ;
      ${sh.path} ${dcat.theme} ;
      ${sh.minLength} 1 ;
      ${sh.order} 100 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Tags" ;
      ${sh.path} ${dcat.keyword} ;
      ${sh.minLength} 1 ;
      ${sh.order} 110 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Landing page" ;
      ${sh.path} ${dcat.landingPage} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 120 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Relation" ;
      ${sh.path} ${dcterms.relation} ;
      ${sh.minLength} 1 ;
      ${sh.order} 130 ;
    ] ;
    ${sh.property} [
      ${sh.name} "See also" ;
      ${sh.path} ${rdfs.seeAlso} ;
      ${sh.minLength} 1 ;
      ${sh.order} 140 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Creation Date" ;
      ${sh.path} ${dcterms.issued} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 150 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Last Update" ;
      ${sh.path} ${dcterms.modified} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 160 ;
    ] ;
  .

  ${$rdf.blankNode('temporal-from-to')} a ${sh.NodeShape} ;
    ${sh.targetClass} ${dcterms.PeriodOfTime} ;
    ${rdfs.label} "Data converage" ;
    ${sh.property} [
      ${sh.name} "Start date" ;
      ${sh.path} ${schema.startDate} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 10 ;
      ] ;
    ${sh.property} [
      ${sh.name} "End date" ;
      ${sh.path} ${schema.endDate} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 20 ;
    ] ;
  .

  ${$rdf.blankNode('vcard-organization')} a ${sh.NodeShape} ;
  ${sh.targetClass} ${vcard.Organization} ;
  ${rdfs.label} "Organization" ;
  ${sh.property} [
    ${sh.name} "Name" ;
    ${sh.path} ${vcard.fn} ;
    ${sh.minCount} 1 ;
    ${sh.maxCount} 1 ;
    ${sh.order} 10 ;
    ] ;
  ${sh.property} [
    ${sh.name} "Email " ;
    ${sh.path} ${vcard.hasEmail} ;
    ${sh.minCount} 1 ;
    ${sh.maxCount} 1 ;
    ${sh.order} 20 ;
  ] ;
.
}
`
