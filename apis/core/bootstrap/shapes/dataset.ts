import { shape, freq } from '@cube-creator/core/namespace'
import { supportedLanguages } from '@cube-creator/core/languages'
import { hydra, rdfs, sh, dcat, dcterms, xsd, rdf, vcard, schema, _void, dash } from '@tpluscode/rdf-ns-builders'
import { sparql, turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'
import { lindasQuery } from '../lib/query'
import { Draft, Published } from '@cube-creator/model/Cube'

const shapeId = shape('dataset/edit-metadata')
const temporalFromTo = $rdf.namedNode(shapeId.value + '#temporalFromTo')
const vcardOrganization = $rdf.namedNode(shapeId.value + '#vcardOrganization')

const themesQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?theme .
  ?theme ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('http://app.cube-creator.lndo.site/themes') as ?c )

  graph   <https://lindas.admin.ch/sfa/opendataswiss> {
    ?theme a ${schema.DefinedTerm} ;
      ${schema.name} ?name ;
      ${schema.inDefinedTermSet} <https://register.ld.admin.ch/opendataswiss/category> ;
      ?p ?o .
  }
}`

const aboutQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?about .
  ?about ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('http://app.cube-creator.lndo.site/themes') as ?c )

    ?termSet a ${schema.DefinedTermSet};
      ${schema.isPartOf} <https://ld.admin.ch/application/cube-creator>.

    ?about a ${schema.DefinedTerm} ;
      ${schema.alternateName} ?name ;
      ${schema.inDefinedTermSet} ?termSet ;
      ?p ?o .
}`

const licenseQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?license .
  ?license ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('http://app.cube-creator.lndo.site/themes') as ?c )

    ?license a ${schema.DefinedTerm}, ${dcterms.LicenseDocument} ;
      ${schema.alternateName} ?name ;
      ${schema.inDefinedTermSet} ?termSet ;
      ?p ?o .
}`

const orgQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?org .
  ?org ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('http://app.cube-creator.lndo.site/org') as ?c )

  graph   <https://lindas.admin.ch/sfa/opendataswiss> {
    ?org a ${schema.Organization} ;
      ${schema.name} ?name ;
      ?p ?o .
  }
}`

/*
 * Properties which are synchronised using `sh:equal` should also be added
 * to `cli/lib/import/cubeMetadata.ts` so that importing a cube ensures
 * both mirrored predicates are set
 */
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
      ${sh.name} "Title" ;
      ${sh.path} ${schema.name} ;
      ${sh.minCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.uniqueLang} true ;
      ${sh.order} 10 ;
      ${sh.description} "A publishable title describing the cube. Please add entries for all [languages](https://github.com/zazuko/cube-creator/wiki/2.-Cube-Designer#languages)." ;
    ] ;
    ${sh.property} [
      ${sh.name} "Title (dcat)" ;
      ${sh.path} ${dcterms.title} ;
      ${sh.minCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${rdf.langString} ;
      ${dash.hidden} true ;
      ${sh.equals} ${schema.name} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Description" ;
      ${sh.path} ${schema.description} ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.uniqueLang} true ;
      ${sh.order} 20 ;
      ${sh.description} "A short description about the provided cube." ;
    ] ;
    ${sh.property} [
      ${sh.name} "Description (dcat)" ;
      ${sh.path} ${dcterms.description} ;
      ${sh.minLength} 1 ;
      ${sh.datatype} ${rdf.langString} ;
      ${dash.hidden} true ;
      ${sh.equals} ${schema.description} ;
    ] ;
    ${sh.property} [
      ${sh.name} "License" ;
      ${sh.path} ${dcterms.license} ;
      ${sh.minCount} 0 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${dcterms.LicenseDocument} ;
      ${hydra.collection} ${lindasQuery(licenseQuery)} ;
      ${sh.order} 25 ;
      ${sh.description} "This is the published terms of use / license for this dataset.";
    ] ;
    ${sh.property} [
      ${sh.name} "Status" ;
      ${sh.path} ${schema.creativeWorkStatus} ;
      ${sh.minCount} 1 ;
      ${sh.maxCount} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.in}
          (
              ${Draft}
              ${Published}
          ) ;
      ${sh.defaultValue} ${Draft} ;
      ${sh.order} 30 ;
      ${sh.description} "Only published datasets will be listed in the external tools. A draft will be nevertheless be public." ;
    ] ;
    ${sh.property} [
        ${sh.name} "Publish to" ;
        ${sh.path} ${schema.workExample} ;
        ${sh.minCount} 0 ;
        ${sh.maxCount} 2 ;
        ${sh.nodeKind} ${sh.IRI} ;
        ${sh.in}
            (
                <https://ld.admin.ch/application/visualize>
                <https://ld.admin.ch/application/opendataswiss>
            ) ;
        ${sh.order} 40 ;
        ${sh.description} "Choose the applications where the dataset shall be listed." ;
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
      ${sh.description} "The intervall in which the dataset is updated with new values.";
    ] ;
    ${sh.property} [
      ${sh.name} "Data period" ;
      ${sh.path} ${dcterms.temporal} ;
      ${sh.minCount} 0 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} ${temporalFromTo} ;
      ${sh.class} ${dcterms.PeriodOfTime} ;
      ${sh.order} 70 ;
      ${sh.description} "The period of time this dataset is covering.";
    ] ;
    ${sh.property} [
      ${sh.name} "About" ;
      ${sh.path} ${schema.about} ;
      ${sh.minCount} 0 ;
      ${sh.class} ${schema.DefinedTerm} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${hydra.collection} ${lindasQuery(aboutQuery)} ;
      ${sh.order} 75 ;
      ${sh.description} "Category what about the dataset is.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Publisher" ;
      ${sh.path} ${dcterms.publisher} ;
      ${sh.nodeKind} ${sh.Literal} ;
      ${sh.minCount} 0 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 75 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Organisation" ;
      ${sh.path} ${dcterms.creator} ;
      ${sh.minCount} 0 ;
      ${sh.class} ${schema.Organization} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${hydra.collection} ${lindasQuery(orgQuery)} ;
      ${sh.order} 80 ;
      ${sh.description} "This is the publishing organization used in opendata.swiss.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Contact Point" ;
      ${sh.path} ${dcat.contactPoint} ;
      ${sh.minCount} 1 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} ${vcardOrganization} ;
      ${sh.class} ${vcard.Organization} ;
      ${sh.order} 90 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Category" ;
      ${sh.path} ${dcat.theme} ;
      ${sh.minCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 100 ;
      ${sh.description} "This is the category used in opendata.swiss.";
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${schema.DefinedTerm} ;
      ${hydra.collection} ${lindasQuery(themesQuery)} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Keywords" ;
      ${sh.path} ${dcat.keyword} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.minLength} 1 ;
      ${sh.order} 110 ;
      ${sh.description} "Additional keywords to classify datasets along ad-hoc categories. Enter each keyword in a separate entry.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Landing page" ;
      ${sh.path} ${dcat.landingPage} ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 120 ;
      ${sh.description} "A public website describing the dataset.";
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
  rdfs:label "visualize.admin.ch  " .

<https://ld.admin.ch/application/opendataswiss> a skos:Concept ;
  rdfs:label "opendata.swiss" .

<https://ld.admin.ch/definedTerm/CreativeWorkStatus/Published> a schema:DefinedTerm;
  rdfs:label "Published" .

<https://ld.admin.ch/definedTerm/CreativeWorkStatus/Draft> a schema:DefinedTerm;
  rdfs:label "Draft" .

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
