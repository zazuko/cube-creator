import { turtle } from '@tpluscode/rdf-string'
import { shape } from '@cube-creator/core/namespaces/shapes'
import { dcterms, hydra, rdfs, schema, sh } from '@tpluscode/rdf-ns-builders'
import env from '@cube-creator/core/env/node'
import { cc } from '@cube-creator/core/namespace'

let jobTriggerProperties = turtle``
if (env.PIPELINE_TYPE === 'github') {
  jobTriggerProperties = turtle`${sh.property} [
    ${sh.path} ${dcterms.identifier} ;
    ${sh.name} "GitHub Personal Access Token" ;
    ${sh.minLength} 1 ;
    ${sh.minCount} 1 ;
    ${sh.maxCount} 1 ;
  ] ;`
}

export const JobTriggerShape = turtle`
${shape('job/trigger')} {
  ${shape('job/trigger')} a ${sh.NodeShape} , ${hydra.Resource} ;
    ${jobTriggerProperties}
  .
}`

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
      ${cc.CanceledJobStatus}
    )
  ] ;
}`
