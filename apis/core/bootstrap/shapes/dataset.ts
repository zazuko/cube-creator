import { cc, shape, freq } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh, dcat, dcterms, xsd, rdf, vcard, schema, _void, dash } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

export const DatasetShape = turtle`
@prefix cld: <http://purl.org/cld/terms/> .
@prefix dcam: <http://purl.org/dc/dcam/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix freq: <http://purl.org/cld/freq/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

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
        ( ${freq.triennial} 
          ${freq.biennial} 
          ${freq.annual} 
          ${freq.semiannual} 
          ${freq.threeTimesAYear}
          ${freq.quarterly} 
          ${freq.bimonthly}
          ${freq.monthly}
          ${freq.semimonthly}
          ${freq.biweekly}
          ${freq.threeTimesAMonth}
          ${freq.weekly}
          ${freq.semiweekly}
          ${freq.threeTimesAWeek}
          ${freq.daily} 
          ${freq.continuous}
          ${freq.irregular} ) ;
      ${sh.order} 60 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Data period" ;
      ${sh.path} ${dcterms.temporal} ;
      ${sh.minCount} 1 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} ${$rdf.blankNode('temporal-from-to')} ;
      ${sh.class} ${dcterms.PeriodOfTime} ;
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
      ${sh.class} ${vcard.Organization} ;
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


freq:annual a skos:Concept ;
    rdfs:label "Annual"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs once a year."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Annual"@en .

freq:biennial a skos:Concept ;
    rdfs:label "Biennial"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs every two years."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Biennial"@en .

freq:bimonthly a skos:Concept ;
    rdfs:label "Bimonthly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs every two months."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Bimonthly"@en .

freq:biweekly a skos:Concept ;
    rdfs:label "Biweekly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs every two weeks."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Biweekly"@en .

freq:continuous a skos:Concept ;
    rdfs:label "Continuous"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event repeats without interruption."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Continuous"@en .

freq:daily a skos:Concept ;
    rdfs:label "Daily"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs once a day."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Daily"@en .

freq:irregular a skos:Concept ;
    rdfs:label "Irregular"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs at uneven intervals."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Irregular"@en .

freq:monthly a skos:Concept ;
    rdfs:label "Monthly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs once a month."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Monthly"@en .

freq:quarterly a skos:Concept ;
    rdfs:label "Quarterly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs every three months."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Quarterly"@en .

freq:semiannual a skos:Concept ;
    rdfs:label "Semiannual"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs twice a year."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Semiannual"@en .

freq:semimonthly a skos:Concept ;
    rdfs:label "Semimonthly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs twice a month."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Semimonthly"@en .

freq:semiweekly a skos:Concept ;
    rdfs:label "Semiweekly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs twice a week."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Semiweekly"@en .

freq:threeTimesAMonth a skos:Concept ;
    rdfs:label "Three times a month"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs three times a month."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Three times a month"@en .

freq:threeTimesAWeek a skos:Concept ;
    rdfs:label "Three times a week"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs three times a week."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Three times a week"@en .

freq:threeTimesAYear a skos:Concept ;
    rdfs:label "Three times a year"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs three times a year."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Three times a year"@en .

freq:triennial a skos:Concept ;
    rdfs:label "Triennial"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs every three years."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Triennial"@en .

freq:weekly a skos:Concept ;
    rdfs:label "Weekly"@en ;
    dcam:memberOf cld:Frequency ;
    rdfs:comment "The event occurs once a week."@en ;
    rdfs:isDefinedBy freq: ;
    rdfs:seeAlso <http://www.loc.gov/marc/holdings/echdcapt.html> ;
    skos:inScheme cld:Frequency ;
    skos:prefLabel "Weekly"@en .

freq: dcterms:creator [ rdfs:label "Dublin Core Collection Description Task Group" ] ;
    dcterms:modified "2013-05-10"^^dcterms:W3CDTF ;
    dcterms:title "The Collection Description Frequency Namespace"@en .
}

`
