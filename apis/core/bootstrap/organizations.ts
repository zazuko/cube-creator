import { turtle } from '@tpluscode/rdf-string'
import { dcat, hydra, rdf, rdfs, schema, _void } from '@tpluscode/rdf-ns-builders'
import { cc, cube } from '@cube-creator/core/namespace'

export const organizations = turtle`
<organizations> {
  <organizations> a ${hydra.Collection} ;
    ${hydra.title} "Publishing profiles" ;
    ${hydra.manages} [
      ${hydra.property} ${rdf.type} ;
      ${hydra.object} ${schema.Organization}
    ] .
}

<organization/bafu> {
  <organization/bafu>
    a ${schema.Organization} ;
    ${cc.publishGraph}  <https://lindas.admin.ch/foen/cube> ;
    ${cc.namespace} <https://environment.ld.admin.ch/foen/> ;
    ${schema.dataset} <https://environment.ld.admin.ch/.well-known/void> ;
    ${rdfs.label} "Bundesamt für Umwelt"@de ;
    ${rdfs.label} "Office fédéral de l'environnement"@fr ;
    ${rdfs.label} "Ufficio federale dell'ambiente"@it ;
    ${rdfs.label} "Federal Office for the Environment"@en ;
    ${dcat.accessURL} <https://environment.ld.admin.ch/sparql> ;
    ${_void.sparqlEndpoint} <https://environment.ld.admin.ch/query> ;
    ${cube.observedBy} <https://ld.admin.ch/office/VII.1.7> ;
  .
}

<organization/sfa> {
  <organization/sfa>
    a ${schema.Organization} ;
    ${cc.publishGraph}  <https://lindas.admin.ch/sfa/cube> ;
    ${cc.namespace} <https://culture.ld.admin.ch/sfa/> ;
    ${schema.dataset} <https://culture.ld.admin.ch/.well-known/void> ;
    ${rdfs.label} "Schweizerisches Bundesarchiv"@de ;
    ${rdfs.label} "Archives fédérales suisses"@fr ;
    ${rdfs.label} "Archivio federale svizzero"@it ;
    ${rdfs.label} "Swiss Federal Archives"@en ;
    ${dcat.accessURL} <https://culture.ld.admin.ch/sparql> ;
    ${_void.sparqlEndpoint} <https://culture.ld.admin.ch/query> ;
    ${cube.observedBy} <https://ld.admin.ch/office/II.1.4> ;
  .
}

<organization/sfoe> {
  <organization/sfoe>
    a ${schema.Organization} ;
    ${cc.publishGraph}  <https://lindas.admin.ch/sfoe/cube> ;
    ${cc.namespace} <https://energy.ld.admin.ch/sfoe/> ;
    ${schema.dataset} <https://energy.ld.admin.ch/.well-known/void> ;
    ${rdfs.label} "Bundesamt für Energie"@de ;
    ${rdfs.label} "Office fédéral de l'énergie"@fr ;
    ${rdfs.label} "Ufficio federale dell'energia"@it ;
    ${rdfs.label} "Swiss Federal Office of Energy"@en ;
    ${dcat.accessURL} <https://energy.ld.admin.ch/sparql> ;
    ${_void.sparqlEndpoint} <https://energy.ld.admin.ch/query> ;
    ${cube.observedBy} <https://ld.admin.ch/office/VII.1.4> ;
  .
}

<organization/fch> {
  <organization/fch>
    a ${schema.Organization} ;
    ${cc.publishGraph}  <https://lindas.admin.ch/fch/cube> ;
    ${cc.namespace} <https://politics.ld.admin.ch/fch/> ;
    ${schema.dataset} <https://politics.ld.admin.ch/.well-known/void> ;
    ${rdfs.label} "Federal Chancellery"@en ;
    ${rdfs.label} "Bundeskanzlei"@de ;
    ${rdfs.label} "Cancelleria federale"@it ;
    ${rdfs.label} "Chancellerie fédérale"@fr ;
    ${dcat.accessURL} <https://politics.ld.admin.ch/sparql> ;
    ${_void.sparqlEndpoint} <https://politics.ld.admin.ch/query> ;
    ${cube.observedBy} <https://ld.admin.ch/FCh> ;
  .
}

<organization/agroscope> {
  <organization/agroscope>
    a ${schema.Organization} ;
    ${cc.publishGraph}  <https://lindas.admin.ch/agroscope/cube> ;
    ${cc.namespace} <https://agriculture.ld.admin.ch/agroscope/> ;
    ${schema.dataset} <https://agriculture.ld.admin.ch/.well-known/void> ;
    ${rdfs.label} "Agroscope"@en ;
    ${rdfs.label} "Agroscope"@de ;
    ${rdfs.label} "Agroscope"@it ;
    ${rdfs.label} "Agroscope"@fr ;
    ${dcat.accessURL} <https://agriculture.ld.admin.ch/sparql> ;
    ${_void.sparqlEndpoint} <https://agriculture.ld.admin.ch/query> ;
    ${cube.observedBy} <https://register.ld.admin.ch/staatskalender/organization/10003634> ;
  .
}

<organization/ofcom> {
  <organization/ofcom>
    a ${schema.Organization} ;
    ${cc.publishGraph}  <https://lindas.admin.ch/ofcom/cube> ;
    ${cc.namespace} <https://communication.ld.admin.ch/ofcom/> ;
    ${schema.dataset} <https://communication.ld.admin.ch/.well-known/void> ;
    ${rdfs.label} "Federal Office of Communications OFCOM"@en ;
    ${rdfs.label} "Bundesamt für Kommunikation BAKOM"@de ;
    ${rdfs.label} "Ufficio federale delle comunicazioni UFCOM"@it ;
    ${rdfs.label} "Office fédéral de la communication OFCOM"@fr ;
    ${dcat.accessURL} <https://communication.ld.admin.ch/sparql> ;
    ${_void.sparqlEndpoint} <https://communication.ld.admin.ch/query> ;
    ${cube.observedBy} <https://ld.admin.ch/office/V.1.7> ;
  .
}
`
