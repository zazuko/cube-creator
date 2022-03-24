import { shape, editor } from '@cube-creator/core/namespace'
import { supportedLanguages } from '@cube-creator/core/languages'
import { hydra, rdfs, sh, dcat, dcterms, xsd, rdf, vcard, schema, _void, dash, skos } from '@tpluscode/rdf-ns-builders'
import { sparql, turtle } from '@tpluscode/rdf-string'
import $rdf from 'rdf-ext'
import { Draft, Published } from '@cube-creator/model/Cube'
import env from '@cube-creator/core/env'
import { lindasQuery } from '../lib/query'

const shapeId = shape('dataset/edit-metadata')
const temporalFromTo = $rdf.namedNode(shapeId.value + '#temporalFromTo')
const vcardOrganization = $rdf.namedNode(shapeId.value + '#vcardOrganization')

const themesQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?theme .
  ?theme ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('${env.API_CORE_BASE}themes') as ?c )

  graph   <https://lindas.admin.ch/sfa/opendataswiss> {
    ?theme a ${schema.DefinedTerm} ;
      ${schema.name} ?name ;
      ${schema.inDefinedTermSet} <https://register.ld.admin.ch/opendataswiss/category> ;
      ?p ?o .
  }
}`

const euThemesQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?theme .
  ?theme ${rdfs.label} ?name .
} WHERE {
  BIND ( iri('${env.API_CORE_BASE}eu-themes') as ?c )

  graph <https://lindas.admin.ch/ontologies> {
    ?theme a <http://publications.europa.eu/ontology/euvoc#DataTheme> ;
      ${skos.prefLabel} ?name ;
      ${skos.inScheme} <http://publications.europa.eu/resource/authority/data-theme> .

    filter (lang(?name) in ("en", "de", "rm", "fr", "it" ))
  }
}`

const aboutQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?about .
  ?about ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('${env.API_CORE_BASE}about') as ?c )

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
  BIND ( iri('${env.API_CORE_BASE}licenses') as ?c )

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
  BIND ( iri('${env.API_CORE_BASE}org') as ?c )

  graph   <https://lindas.admin.ch/sfa/opendataswiss> {
    ?org a ${schema.Organization} ;
      ${schema.name} ?name ;
      ?p ?o .
  }
}`

const frequencyQuery = sparql`construct {
  ?c a ${hydra.Collection} .
  ?c ${hydra.member} ?freq .
  ?freq ${rdfs.label} ?name ; ?p ?o .
} WHERE {
  BIND ( iri('${env.API_CORE_BASE}freq') as ?c )

  graph <https://lindas.admin.ch/ontologies> {
    ?freq a <http://publications.europa.eu/ontology/euvoc#Frequency> ;
      ${skos.prefLabel} ?name ;
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
      ${sh.name} "Opendata.swiss License (otab)" ;
      ${sh.path} ${dcterms.rights} ;
      ${sh.minCount} 0 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${dcterms.LicenseDocument} ;
      ${hydra.collection} ${lindasQuery(licenseQuery)} ;
      ${sh.order} 45 ;
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
      ${sh.name} "Opendata.swiss Data refresh interval (otab)" ;
      ${sh.path} ${dcterms.accrualPeriodicity} ;
      ${sh.minCount} 0 ;
      ${sh.minLength} 1 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} <http://publications.europa.eu/ontology/euvoc#Frequency> ;
      ${hydra.collection} ${lindasQuery(frequencyQuery)} ;
      ${sh.order} 60 ;
      ${sh.description} "The intervall in which the dataset is updated with new values.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Data period (otab)" ;
      ${sh.path} ${dcterms.temporal} ;
      ${sh.minCount} 0 ;
      ${dash.editor} ${dash.DetailsEditor} ;
      ${sh.node} ${temporalFromTo} ;
      ${sh.class} ${dcterms.PeriodOfTime} ;
      ${sh.order} 70 ;
      ${sh.description} "The period of time this dataset is covering.";
    ] ;
    ${sh.property} [
      ${sh.name} "About (atab)" ;
      ${sh.path} ${schema.about} ;
      ${sh.minCount} 0 ;
      ${sh.class} ${schema.DefinedTerm} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${hydra.collection} ${lindasQuery(aboutQuery)} ;
      ${sh.order} 75 ;
      ${sh.description} "Category what about the dataset is.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Publisher (otab)" ;
      ${sh.path} ${dcterms.publisher} ;
      ${sh.nodeKind} ${sh.Literal} ;
      ${sh.minCount} 0 ;
      ${sh.maxCount} 1 ;
      ${sh.order} 75 ;
      ${sh.description} "The publisher in the Opendata.swiss Organisation. E.g. the office, or also external organisations.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Organisation (otab)" ;
      ${sh.path} ${dcterms.creator} ;
      ${sh.minCount} 0 ;
      ${sh.class} ${schema.Organization} ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${hydra.collection} ${lindasQuery(orgQuery)} ;
      ${sh.order} 80 ;
      ${sh.description} "This is the publishing organization used in opendata.swiss.";
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
      ${sh.name} "Category" ;
      ${sh.path} ${dcat.theme} ;
      ${sh.minCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 100 ;
      ${sh.description} "This is the category based on opendata.swiss.";
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} ${schema.DefinedTerm} ;
      ${hydra.collection} ${lindasQuery(themesQuery)} ;
    ] ;
    ${sh.property} [
      ${sh.name} "EU Data Theme Category (adata)" ;
      ${sh.path} <https://schema.ld.admin.ch/euDataTheme> ;
      ${sh.minLength} 1 ;
      ${sh.order} 105 ;
      ${sh.description} "The Data Theme Category for the classification in the European Data Catalogs.";
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.class} <http://publications.europa.eu/ontology/euvoc#DataTheme> ;
      ${hydra.collection} ${lindasQuery(euThemesQuery)} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Keywords (otab)" ;
      ${sh.path} ${dcat.keyword} ;
      ${sh.datatype} ${rdf.langString} ;
      ${sh.languageIn} ( ${supportedLanguages} ) ;
      ${sh.minLength} 1 ;
      ${sh.order} 110 ;
      ${sh.description} "Additional keywords to classify datasets along ad-hoc categories.";
      ${dash.editor} ${editor.TagsWithLanguageEditor} ;
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Landing page (otab)" ;
      ${sh.path} ${dcat.landingPage} ;
      ${sh.maxCount} 1 ;
      ${sh.minLength} 1 ;
      ${sh.order} 120 ;
      ${sh.description} "A public website describing the dataset.";
    ] ;
    ${sh.property} [
      ${sh.name} "Opendata.swiss Legal basis (otab)" ;
      ${sh.path} ${dcterms.license} ;
      ${sh.minCount} 0 ;
      ${sh.nodeKind} ${sh.IRI} ;
      ${sh.order} 130 ;
      ${sh.description} "A website describing the legal basis to publish this data";
    ] ;
   ${sh.property} [
      ${sh.name} "Opendatat.swiss Creation Date (otab)" ;
      ${sh.description} "Date when dataset has been assembled. It defaults to when project is created" ;
      ${sh.path} ${dcterms.issued} ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 150 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Opendatat.swiss Date published (otab)" ;
      ${sh.path} ${schema.datePublished} ;
      ${sh.description} "Date when dataset is first published to the portal. It is set automatically but can be changed later" ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${sh.order} 160 ;
    ] ;
    ${sh.property} [
      ${sh.name} "Creation Date (atab)" ;
      ${sh.path} ${schema.dateCreated} ;
      ${sh.maxCount} 1 ;
      ${sh.datatype} ${xsd.date} ;
      ${dash.hidden} true ;
      ${sh.equals} ${dcterms.issued} ;
    ] ;
    ${sh.property} [
      ${sh.path} ${dcterms.identifier} ;
      ${sh.maxCount} 0 ;
      ${dash.hidden} true ;
      ${sh.message} "Metadata must not have the dcterms:identifier property. Please remove it in advanced RDF editor" ;
    ] ;
  .

  ${temporalFromTo} a ${sh.NodeShape} ;
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

${Published} a schema:DefinedTerm;
  rdfs:label "Published" .

${Draft} a schema:DefinedTerm;
  rdfs:label "Draft" .

}
`
