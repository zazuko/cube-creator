import { turtle } from '@tpluscode/rdf-string'
import { dcat, hydra, rdf, rdfs, schema, _void } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const organizations = turtle`
<organizations> {
  <organizations> a ${hydra.Collection} ;
    ${hydra.title} "Organization profiles" ;
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
    ${dcat.accessURL} <https://environment.ld.admin.ch/query> ;
    ${_void.sparqlEndpoint} <https://environment.ld.admin.ch/sparql> ;
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
    ${dcat.accessURL} <https://culture.ld.admin.ch/query> ;
    ${_void.sparqlEndpoint} <https://culture.ld.admin.ch/sparql> ;
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
    ${dcat.accessURL} <https://energy.ld.admin.ch/query> ;
    ${_void.sparqlEndpoint} <https://energy.ld.admin.ch/sparql> ;
  .
}
`
