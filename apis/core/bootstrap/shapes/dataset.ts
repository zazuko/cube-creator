import { shape, freq } from '@cube-creator/core/namespace'
import { hydra, rdfs, sh, dcat, dcterms, xsd, rdf, vcard, schema, _void, dash } from '@tpluscode/rdf-ns-builders'
import { turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'

const shapeId = shape('dataset/edit-metadata')
const temporalFromTo = $rdf.namedNode(shapeId.value + '#temporalFromTo')
const vcardOrganization = $rdf.namedNode(shapeId.value + '#vcardOrganization')

export const DatasetShape = turtle`
@prefix cld: <http://purl.org/cld/terms/> .
@prefix dcam: <http://purl.org/dc/dcam/> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix freq: <http://purl.org/cld/freq/> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

${shapeId} {
  ${shapeId} a ${sh.NodeShape}, ${hydra.Resource} ;
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
      ${sh.path} ${dcterms.description} ;
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
      ${sh.defaultValue} "Draft" ;
      ${sh.order} 30 ;
    ] ;
    ${sh.property} [
        ${sh.name} "Publish to" ;
        ${sh.path} ${schema.workExample} ;
        ${sh.minCount} 0 ;
        ${sh.maxCount} 2 ;
        ${sh.in} 
            (
                <https://ld.admin.ch/application/visualize>
                <https://ld.admin.ch/application/opendataswiss>
            ) ;
        ${sh.order} 40 ;
      ] ;    
    ${sh.property} [
      ${sh.name} "Data refresh interval" ;
      ${sh.path} ${dcterms.accrualPeriodicity} ;
      ${sh.minCount} 0 ;
      ${sh.minLength} 1 ;
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
      ${sh.node} ${temporalFromTo} ;
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
      ${sh.node} ${vcardOrganization} ;
      ${sh.class} ${vcard.Organization} ;
      ${sh.order} 90 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Theme" ;
      ${sh.path} ${dcat.theme} ;
      ${sh.minCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 100 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in}
      (
        <http://opendata.swiss/themes/administration>
        <http://opendata.swiss/themes/agriculture>
        <http://opendata.swiss/themes/construction>
        <http://opendata.swiss/themes/crime>
        <http://opendata.swiss/themes/culture>
        <http://opendata.swiss/themes/education>
        <http://opendata.swiss/themes/energy>
        <http://opendata.swiss/themes/finances>
        <http://opendata.swiss/themes/geography>
        <http://opendata.swiss/themes/health>
        <http://opendata.swiss/themes/industry>
        <http://opendata.swiss/themes/legislation>
        <http://opendata.swiss/themes/mobility>
        <http://opendata.swiss/themes/national-economy>
        <http://opendata.swiss/themes/politics>
        <http://opendata.swiss/themes/population>
        <http://opendata.swiss/themes/prices>
        <http://opendata.swiss/themes/public-order>
        <http://opendata.swiss/themes/social-security>
        <http://opendata.swiss/themes/statistical-basis>
        <http://opendata.swiss/themes/territory>
        <http://opendata.swiss/themes/tourism>
        <http://opendata.swiss/themes/trade>
        <http://opendata.swiss/themes/work>
      ) ;
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
      ${sh.description} "Date when dataset has been assembled. It defaults to when project is created" ;
      ${sh.path} ${dcterms.issued} ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 150 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Date published" ;
      ${sh.path} ${schema.datePublished} ;
      ${sh.description} "Date when dataset is first published to the portal. It is set automatically but can be changed later" ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 160 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Creation Date" ;
      ${sh.path} ${schema.dateCreated} ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${dash.hidden} true ;
      ${sh.equals} ${dcterms.issued} ;
    ] ;
  .

  ${temporalFromTo} a ${sh.NodeShape} ;
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

  ${vcardOrganization} a ${sh.NodeShape} ;
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


<https://ld.admin.ch/application/visualize> a skos:Concept ;
  rdfs:label "Visualize" .

<https://ld.admin.ch/application/opendataswiss> a skos:Concept ;
  rdfs:label "opendata.swiss" .

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

<http://opendata.swiss/themes/administration> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Administration"@en .



<http://opendata.swiss/themes/agriculture> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Agriculture, forestry"@en .

<http://opendata.swiss/themes/construction> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Construction and housing"@en .


<http://opendata.swiss/themes/crime> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Crime, criminal justice"@en .

<http://opendata.swiss/themes/culture> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Culture, media, information society, sport"@en.

<http://opendata.swiss/themes/education> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Education and science"@en .

<http://opendata.swiss/themes/energy> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Energy"@en .

<http://opendata.swiss/themes/finances> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Finances"@en .

<http://opendata.swiss/themes/geography> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Geography"@en.

<http://opendata.swiss/themes/health> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Health"@en .

<http://opendata.swiss/themes/industry> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Industry and services"@en .

<http://opendata.swiss/themes/legislation> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Legislation"@en .

<http://opendata.swiss/themes/mobility> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Mobility and Transport"@en .

<http://opendata.swiss/themes/national-economy> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "National economy"@en .

<http://opendata.swiss/themes/politics> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Politics"@en .

<http://opendata.swiss/themes/population> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Population"@en .

<http://opendata.swiss/themes/prices> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Prices"@en .

<http://opendata.swiss/themes/public-order> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Public order and security"@en .

<http://opendata.swiss/themes/social-security> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Social security"@en .

<http://opendata.swiss/themes/statistical-basis> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Statistical basis"@en .

<http://opendata.swiss/themes/territory> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Territory and environment"@en .

<http://opendata.swiss/themes/tourism> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Tourism"@en .

<http://opendata.swiss/themes/trade> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Trade"@en .

<http://opendata.swiss/themes/work> a skos:Concept ;
    skos:definition ""@de,
        ""@en,
        ""@fr,
        ""@it ;
    rdfs:label "Work and income"@en .
}

`
