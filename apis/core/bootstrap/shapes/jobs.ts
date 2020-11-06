import { turtle } from '@tpluscode/rdf-string'
import { shape } from '@cube-creator/core/namespaces/shapes'
import { hydra, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'

export const JobUpdateShape = turtle`
${shape('job/update')} {
  ${shape('job/update')} a ${sh.NodeShape}, ${hydra.Resource} ;
  ${sh.property} [
    ${sh.path} ${rdfs.seeAlso} ;
    ${sh.maxCount} 1 ;
    ${sh.nodeKind} ${sh.IRI} ;
  ], [
    ${sh.path} ${schema.actionStatus} ;
    ${sh.maxCount} 1 ;
    ${sh.nodeKind} ${sh.IRI} ;
    ${sh.in} (
      ${schema.ActiveActionStatus}
      ${schema.FailedActionStatus}
      ${schema.CompletedActionStatus}
    )
  ] ;
}`
