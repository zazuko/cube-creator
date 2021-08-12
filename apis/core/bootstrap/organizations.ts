import { turtle } from '@tpluscode/rdf-string'
import { hydra, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

export const organizations = turtle`
<organizations> {
  <organizations> a ${hydra.Collection} ;
    ${hydra.title} "Organizations" ;
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
    ${rdfs.label} "Bundesamt für Umwelt BAFU"@de ;
    ${rdfs.label} "Office fédéral de l'environnement OFEV"@fr ;
    ${rdfs.label} "Ufficio federale dell'ambiente UFAM"@it ;
    ${rdfs.label} "Federal Office for the Environment FOEN"@en ;
  .
}
`
